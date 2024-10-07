#!/usr/bin/env ts-node

import * as anchor from "@project-serum/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import yargs from "yargs";

async function main() {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    const program = anchor.workspace.LasagnaFinanceCliDemo;

    const argv = yargs
        .command("stake", "Stake an amount of tokens", {
            amount: {
                description: "Amount to stake",
                alias: "a",
                type: "number",
            },
        })
        .command("withdraw", "Withdraw staked tokens", {
            amount: {
                description: "Amount to withdraw",
                alias: "a",
                type: "number",
            },
        })
        .command("restake", "Restake tokens")
        .demandCommand(1, "You must provide a valid command")
        .help().argv;

    const command = argv._[0];

    // Generate keypair for simplicity (use from file for real-world use)
    const user = anchor.web3.Keypair.generate();

    if (command === "stake") {
        const amount = argv.amount as number;
        const [stakeAccount, bump] = await PublicKey.findProgramAddress(
            [Buffer.from("stake"), user.publicKey.toBuffer()],
            program.programId
        );
        await program.methods
            .stake(new anchor.BN(amount))
            .accounts({
                user: user.publicKey,
                stakeAccount,
                systemProgram: SystemProgram.programId,
            })
            .signers([user])
            .rpc();
        console.log(`Successfully staked ${amount} tokens.`);
    }

    if (command === "withdraw") {
        const amount = argv.amount as number;
        const [stakeAccount, bump] = await PublicKey.findProgramAddress(
            [Buffer.from("stake"), user.publicKey.toBuffer()],
            program.programId
        );
        await program.methods
            .withdraw(new anchor.BN(amount))
            .accounts({
                user: user.publicKey,
                stakeAccount,
            })
            .signers([user])
            .rpc();
        console.log(`Successfully withdrew ${amount} tokens.`);
    }

    if (command === "restake") {
        const [stakeAccount, bump] = await PublicKey.findProgramAddress(
            [Buffer.from("stake"), user.publicKey.toBuffer()],
            program.programId
        );
        await program.methods
            .restake()
            .accounts({
                user: user.publicKey,
                stakeAccount,
            })
            .signers([user])
            .rpc();
        console.log("Successfully restaked tokens.");
    }
}

main();
