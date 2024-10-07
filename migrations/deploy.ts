import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { LasagnaFinanceCliDemo } from '../target/types/lasagna_finance_cli_demo';

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.LasagnaFinanceCliDemo as Program<LasagnaFinanceCliDemo>;

  console.log('Deploying Lasagna Finance CLI Demo...');
  console.log('Program ID:', program.programId.toString());

  // You can add additional deployment logic here if needed

  console.log('Deployment complete!');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});