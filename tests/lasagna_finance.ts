import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { assert } from 'chai';
import { LasagnaFinanceCliDemo } from '../target/types/lasagna_finance_cli_demo';

describe('Lasagna Finance CLI Demo', () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.LasagnaFinanceCliDemo as Program<LasagnaFinanceCliDemo>;

  // Helper function to create a new stake account
  async function createStakeAccount(user: anchor.web3.Keypair, amount: number) {
    const [stakeAccount, bump] = await PublicKey.findProgramAddress(
      [Buffer.from("stake"), user.publicKey.toBuffer()],
      program.programId
    );
    
    await program.methods.stake(new anchor.BN(amount))
      .accounts({
        user: user.publicKey,
        stakeAccount,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    return { stakeAccount, bump };
  }

  it('Allows a user to stake', async () => {
    const user = anchor.web3.Keypair.generate();
    const initialAmount = 100;

    // Airdrop some SOL to the user
    await provider.connection.requestAirdrop(user.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);

    // Create stake account and stake tokens
    const { stakeAccount } = await createStakeAccount(user, initialAmount);

    // Fetch the stake account and verify the amount
    const stakeAccountData = await program.account.stakeAccount.fetch(stakeAccount);
    assert.equal(stakeAccountData.amount.toNumber(), initialAmount);
  });

  it('Prevents restaking before 24 hours', async () => {
    const user = anchor.web3.Keypair.generate();
    const initialAmount = 100;

    // Airdrop some SOL to the user
    await provider.connection.requestAirdrop(user.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);

    // Create stake account and stake tokens
    const { stakeAccount } = await createStakeAccount(user, initialAmount);

    // Try to restake right away
    try {
      await program.methods.restake()
        .accounts({
          user: user.publicKey,
          stakeAccount,
        })
        .signers([user])
        .rpc();
    } catch (error) {
      assert.equal(error.error.errorMessage, 'Restake time buffer not met');
    }
  });

  it('Allows restaking after 24 hours', async () => {
    const user = anchor.web3.Keypair.generate();
    const initialAmount = 100;

    // Airdrop some SOL to the user
    await provider.connection.requestAirdrop(user.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);

    // Create stake account and stake tokens
    const { stakeAccount } = await createStakeAccount(user, initialAmount);

    // Simulate 24 hours passing
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(user.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL)
    );

    // Try restaking after 24 hours
    await program.methods.restake()
      .accounts({
        user: user.publicKey,
        stakeAccount,
      })
      .signers([user])
      .rpc();
  });

  it('Allows withdrawal', async () => {
    const user = anchor.web3.Keypair.generate();
    const initialAmount = 100;

    // Airdrop some SOL to the user
    await provider.connection.requestAirdrop(user.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);

    // Create stake account and stake tokens
    const { stakeAccount } = await createStakeAccount(user, initialAmount);

    // Withdraw tokens
    await program.methods.withdraw(new anchor.BN(initialAmount))
      .accounts({
        user: user.publicKey,
        stakeAccount,
      })
      .signers([user])
      .rpc();

    const stakeAccountData = await program.account.stakeAccount.fetch(stakeAccount);
    assert.equal(stakeAccountData.amount.toNumber(), 0);
  });
});
