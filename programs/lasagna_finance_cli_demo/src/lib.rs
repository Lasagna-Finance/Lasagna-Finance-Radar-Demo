use anchor_lang::prelude::*;

declare_id!("3v3STGegvYRDWb7GkQL5QzCbygVNDDapJrrLrXPd2zAT");


#[program]
pub mod lasagna_finance_cli_demo {
    use super::*;

    pub fn stake(ctx: Context<Stake>, amount: u64) -> Result<()> {
        let stake_account = &mut ctx.accounts.stake_account;

        if amount == 0 {
            return Err(ErrorCode::InvalidAmount.into());
        }

        stake_account.amount += amount;
        stake_account.last_stake_timestamp = Clock::get()?.unix_timestamp;

        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        let stake_account = &mut ctx.accounts.stake_account;

        if amount == 0 || amount > stake_account.amount {
            return Err(ErrorCode::InvalidAmount.into());
        }

        stake_account.amount -= amount;

        Ok(())
    }

    pub fn restake(ctx: Context<Restake>) -> Result<()> {
        let stake_account = &mut ctx.accounts.stake_account;
        let current_timestamp = Clock::get()?.unix_timestamp;

        if current_timestamp - stake_account.last_stake_timestamp < 86400 { // 24 hours in seconds
            return Err(ErrorCode::RestakeTimeBufferNotMet.into());
        }

        stake_account.last_stake_timestamp = current_timestamp;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        init,
        payer = user,
        space = 8 + 8 + 8,
        seeds = [b"stake", user.key().as_ref()],
        bump
    )]
    pub stake_account: Account<'info, StakeAccount>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        mut,
        seeds = [b"stake", user.key().as_ref()],
        bump
    )]
    pub stake_account: Account<'info, StakeAccount>,
}

#[derive(Accounts)]
pub struct Restake<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        mut,
        seeds = [b"stake", user.key().as_ref()],
        bump
    )]
    pub stake_account: Account<'info, StakeAccount>,
}

#[account]
pub struct StakeAccount {
    pub amount: u64,
    pub last_stake_timestamp: i64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Restake time buffer not met")]
    RestakeTimeBufferNotMet,
}