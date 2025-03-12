// Add the init-if-needed feature to anchor-lang
use anchor_lang::prelude::*;

use std::mem::size_of;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

// Define error codes
#[error_code]
pub enum ErrorCode {
    #[msg("Unauthorized action")]
    Unauthorized,
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Platform is currently paused")]
    PlatformPaused,
    #[msg("Task not found")]
    TaskNotFound,
    #[msg("Task already completed")]
    TaskAlreadyCompleted,
    #[msg("Task has expired")]
    TaskExpired,
    #[msg("Insufficient funds for task creation")]
    InsufficientFunds,
    #[msg("Invalid review submission")]
    InvalidReview,
    #[msg("Review limit already reached")]
    ReviewLimitReached,
    #[msg("User has already reviewed this task")]
    AlreadyReviewed,
    #[msg("Selected option is invalid")]
    InvalidOption,
    #[msg("No funds available to claim")]
    NothingToClaim,
    #[msg("Claim transaction failed")]
    ClaimFailed,
}

// Program seeds
pub const PLATFORM_SEED: &[u8] = b"soundscore-platform";
pub const TASK_SEED: &[u8] = b"soundscore-task";
pub const OPTION_SEED: &[u8] = b"soundscore-option";
pub const REVIEW_SEED: &[u8] = b"soundscore-review";
pub const REVIEWER_SEED: &[u8] = b"soundscore-reviewer";

// Statuses
pub mod task_status {
    pub const ACTIVE: u8 = 0;
    pub const COMPLETED: u8 = 1;
    pub const EXPIRED: u8 = 2;
    pub const CANCELLED: u8 = 3;
}

pub mod payment_status {
    pub const PENDING: u8 = 0;
    pub const PAID: u8 = 1;
    pub const DISPUTED: u8 = 2;
}

#[program]
pub mod soundscore {
    use super::*;

    // Initialize the platform settings
    pub fn initialize_platform(
        ctx: Context<InitializePlatform>,
        fee_percentage: u16,
    ) -> Result<()> {
        let platform = &mut ctx.accounts.platform_account;
        
        platform.authority = ctx.accounts.authority.key();
        platform.fee_percentage = fee_percentage;
        platform.total_tasks = 0;
        platform.total_fees_collected = 0;
        platform.is_paused = false;
        
        Ok(())
    }

    // Create a new task (song submission)
    pub fn create_task(
        ctx: Context<CreateTask>,
        title: String,
        amount: u64,
        expires_at: i64,
        external_id: u64,
        option_metadata_hashes: Vec<String>,
    ) -> Result<()> {
        // Validate platform isn't paused
        let platform = &mut ctx.accounts.platform_account;
        require!(!platform.is_paused, ErrorCode::PlatformPaused);
        
        // Validate inputs
        require!(amount > 0, ErrorCode::InvalidAmount);
        require!(expires_at > Clock::get()?.unix_timestamp, ErrorCode::InvalidAmount);
        require!(!option_metadata_hashes.is_empty(), ErrorCode::InvalidAmount);
        
       
        
        // Initialize task account
        let task = &mut ctx.accounts.task_account;
        task.creator = ctx.accounts.creator.key();
        task.title = title;
        task.amount = amount;
        task.reviews_completed = 0;
        task.created_at = Clock::get()?.unix_timestamp;
        task.expires_at = expires_at;
        task.status = task_status::ACTIVE;
        task.external_id = external_id;
        task.option_count = option_metadata_hashes.len() as u32;
        
        // Update platform stats
        platform.total_tasks = platform.total_tasks.checked_add(1).unwrap();
        
        // Transfer funds from creator to the task account (handled by system program)
        let transfer_amount = amount;
        let cpi_accounts = anchor_lang::system_program::Transfer {
            from: ctx.accounts.creator.to_account_info(),
            to: ctx.accounts.task_account.to_account_info(),
        };
        let cpi_program = ctx.accounts.system_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        
        anchor_lang::system_program::transfer(cpi_ctx, transfer_amount)?;
        
        Ok(())
    }

    // Create an option for a task
    pub fn create_option(
        ctx: Context<CreateOption>, 
        option_id: u32,
        metadata_hash: String,
    ) -> Result<()> {
        let task = &ctx.accounts.task_account;
        let option = &mut ctx.accounts.option_account;
        
        // Verify creator is authorized
        require!(
            task.creator == ctx.accounts.creator.key(),
            ErrorCode::Unauthorized
        );
        
        // Verify task is still active
        require!(task.status == task_status::ACTIVE, ErrorCode::TaskAlreadyCompleted);
        
        // Initialize option
        option.task = ctx.accounts.task_account.key();
        option.option_id = option_id;
        option.metadata_hash = metadata_hash;
        option.vote_count = 0;
        
        Ok(())
    }

    // Submit a review for a task
    pub fn submit_review(
        ctx: Context<SubmitReview>,
        selected_option: u32,
        external_id: u64,
    ) -> Result<()> {
        let current_timestamp = Clock::get()?.unix_timestamp;
        let task_key = ctx.accounts.task_account.key();
        let task_status = ctx.accounts.task_account.status;
        let task_expires_at = ctx.accounts.task_account.expires_at;
        let reviews_completed = ctx.accounts.task_account.reviews_completed;
        let total_reviews_required = ctx.accounts.task_account.total_reviews_required;
        let amount_per_review = ctx.accounts.task_account.amount_per_review;
        let option_task = ctx.accounts.option_account.task;
        let option_id = ctx.accounts.option_account.option_id;
        let reviewer_key = ctx.accounts.reviewer.key();
        
        // Verify task is active
        require!(task_status == task_status::ACTIVE, ErrorCode::TaskAlreadyCompleted);
        
        // Verify task hasn't expired
        require!(
            task_expires_at > current_timestamp,
            ErrorCode::TaskExpired
        );
        
        // Verify review limit not reached
        require!(
            reviews_completed < total_reviews_required,
            ErrorCode::ReviewLimitReached
        );
        
        // Check option validity
        require!(
            option_task == task_key && 
            option_id == selected_option,
            ErrorCode::InvalidOption
        );
        
        // Check if reviewer already submitted (if account is not fresh)
        let review_pubkey = ctx.accounts.review_account.reviewer;
        if review_pubkey != Pubkey::default() {
            require!(review_pubkey != reviewer_key, ErrorCode::AlreadyReviewed);
        }
        
        // Check if reviewer account is new
        let reviewer_pubkey = ctx.accounts.reviewer_account.reviewer_address;
        let is_new_reviewer = reviewer_pubkey == Pubkey::default();
        
        // Initialize review
        let review = &mut ctx.accounts.review_account;
        review.task = task_key;
        review.reviewer = reviewer_key;
        review.selected_option = selected_option;
        review.amount = amount_per_review;
        review.submitted_at = current_timestamp;
        review.payment_status = payment_status::PENDING;
        review.external_id = external_id;
        
        // Update reviewer account
        let reviewer_account = &mut ctx.accounts.reviewer_account;
        if is_new_reviewer {
            reviewer_account.reviewer_address = reviewer_key;
            reviewer_account.total_reviews = 0;
            reviewer_account.pending_amount = 0;
            reviewer_account.total_earned = 0;
            reviewer_account.external_id = 0;
        }
        
        // Update the review counts and amounts
        reviewer_account.total_reviews = reviewer_account.total_reviews.checked_add(1).unwrap();
        reviewer_account.pending_amount = reviewer_account
            .pending_amount
            .checked_add(amount_per_review)
            .unwrap();
        reviewer_account.last_review_at = current_timestamp;
        
        // Update task
        let task = &mut ctx.accounts.task_account;
        task.reviews_completed = task.reviews_completed.checked_add(1).unwrap();
        
        // Check if task is now complete
        if task.reviews_completed >= total_reviews_required {
            task.status = task_status::COMPLETED;
        }
        
        // Update option vote count
        let option = &mut ctx.accounts.option_account;
        option.vote_count = option.vote_count.checked_add(1).unwrap();
        
        Ok(())
    }

    // Claim reviewer earnings
    pub fn claim_earnings(
        ctx: Context<ClaimEarnings>,
        amount: u64,
    ) -> Result<()> {
        let reviewer_account = &mut ctx.accounts.reviewer_account.clone();
        let platform = &ctx.accounts.platform_account;
        
        // Verify platform isn't paused
        require!(!platform.is_paused, ErrorCode::PlatformPaused);
        
        // Verify there are funds to claim
        require!(
            reviewer_account.pending_amount >= amount,
            ErrorCode::NothingToClaim
        );
        
        // Calculate platform fee
        let fee_amount = amount
            .checked_mul(platform.fee_percentage as u64)
            .unwrap()
            .checked_div(10000)
            .unwrap();
        
        let payout_amount = amount.checked_sub(fee_amount).unwrap();
        
        // Find the PDA for this reviewer account
        let seeds = &[
            REVIEWER_SEED,
            reviewer_account.reviewer_address.as_ref(),
            &[*ctx.bumps.get("reviewer_account").unwrap()],
        ];
        let signer = &[&seeds[..]];
        
        // Transfer funds to reviewer
        let cpi_accounts = anchor_lang::system_program::Transfer {
            from: ctx.accounts.reviewer_account.to_account_info(),
            to: ctx.accounts.reviewer.to_account_info(),
        };
        let cpi_program = ctx.accounts.system_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(
            cpi_program,
            cpi_accounts,
            signer,
        );
        
        anchor_lang::system_program::transfer(cpi_ctx, payout_amount)?;
        
        // Update reviewer account
        reviewer_account.pending_amount = reviewer_account
            .pending_amount
            .checked_sub(amount)
            .unwrap();
        reviewer_account.total_earned = reviewer_account
            .total_earned
            .checked_add(payout_amount)
            .unwrap();
        
        Ok(())
    }

    // Update task status (admin function)
    pub fn update_task_status(
        ctx: Context<UpdateTaskStatus>,
        new_status: u8,
    ) -> Result<()> {
        let task = &mut ctx.accounts.task_account;
        let platform = &ctx.accounts.platform_account;
        
        // Verify caller is platform authority
        require!(
            platform.authority == ctx.accounts.authority.key(),
            ErrorCode::Unauthorized
        );
        
        // Update task status
        task.status = new_status;
        
        Ok(())
    }

    // Refund remaining funds to creator when task expires or is cancelled
    pub fn refund_remaining_funds(
        ctx: Context<RefundRemainingFunds>,
    ) -> Result<()> {
        let task = &mut ctx.accounts.task_account.clone();
        
        // Verify caller is task creator
        require!(
            task.creator == ctx.accounts.creator.key(),
            ErrorCode::Unauthorized
        );
        
        // Verify task is expired or cancelled
        require!(
            task.status == task_status::EXPIRED || task.status == task_status::CANCELLED || 
            task.expires_at < Clock::get()?.unix_timestamp,
            ErrorCode::TaskAlreadyCompleted
        );
        
        // Calculate remaining funds
        let used_funds = task
            .amount_per_review
            .checked_mul(task.reviews_completed as u64)
            .unwrap();
        
        let remaining_funds = task.amount.checked_sub(used_funds).unwrap();
        
        // If no funds to refund, return early
        if remaining_funds == 0 {
            return Ok(());
        }
        
        // Find the PDA for this task
        let seeds = &[
            TASK_SEED,
            task.creator.as_ref(),
            &task.external_id.to_le_bytes(),
            &[*ctx.bumps.get("task_account").unwrap()],
        ];
        let signer = &[&seeds[..]];
        
        // Transfer remaining funds to creator
        let cpi_accounts = anchor_lang::system_program::Transfer {
            from: ctx.accounts.task_account.to_account_info(),
            to: ctx.accounts.creator.to_account_info(),
        };
        let cpi_program = ctx.accounts.system_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(
            cpi_program,
            cpi_accounts,
            signer,
        );
        
        anchor_lang::system_program::transfer(cpi_ctx, remaining_funds)?;
        
        // Update task status if it was just expired
        if task.status == task_status::ACTIVE {
            task.status = task_status::EXPIRED;
        }
        
        Ok(())
    }

    // Set platform pause state (emergency function)
    pub fn set_platform_pause(
        ctx: Context<SetPlatformPause>,
        is_paused: bool,
    ) -> Result<()> {
        let platform = &mut ctx.accounts.platform_account;
        
        // Verify caller is platform authority
        require!(
            platform.authority == ctx.accounts.authority.key(),
            ErrorCode::Unauthorized
        );
        
        // Update pause state
        platform.is_paused = is_paused;
        
        Ok(())
    }
}

// Context for initializing the platform
#[derive(Accounts)]
pub struct InitializePlatform<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + size_of::<PlatformAccount>(),
        seeds = [PLATFORM_SEED],
        bump
    )]
    pub platform_account: Account<'info, PlatformAccount>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

// Context for creating a task
#[derive(Accounts)]
#[instruction(title: String, amount: u64, total_reviews_required: u32, expires_at: i64, external_id: u64)]
pub struct CreateTask<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + size_of::<TaskAccount>() + title.len(),
        seeds = [TASK_SEED, creator.key().as_ref(), &external_id.to_le_bytes()],
        bump
    )]
    pub task_account: Account<'info, TaskAccount>,
    
    #[account(
        mut,
        seeds = [PLATFORM_SEED],
        bump
    )]
    pub platform_account: Account<'info, PlatformAccount>,
    
    #[account(mut)]
    pub creator: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

// Context for creating an option
#[derive(Accounts)]
#[instruction(option_id: u32, metadata_hash: String)]
pub struct CreateOption<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + size_of::<OptionAccount>() + metadata_hash.len(),
        seeds = [OPTION_SEED, task_account.key().as_ref(), &option_id.to_le_bytes()],
        bump
    )]
    pub option_account: Account<'info, OptionAccount>,
    
    #[account(
        mut,
        constraint = task_account.creator == creator.key() @ ErrorCode::Unauthorized
    )]
    pub task_account: Account<'info, TaskAccount>,
    
    #[account(mut)]
    pub creator: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

// Context for submitting a review
#[derive(Accounts)]
#[instruction(selected_option: u32, external_id: u64)]
pub struct SubmitReview<'info> {
    #[account(
        init_if_needed,
        payer = reviewer,
        space = 8 + size_of::<ReviewAccount>(),
        seeds = [REVIEW_SEED, task_account.key().as_ref(), reviewer.key().as_ref()],
        bump
    )]
    pub review_account: Account<'info, ReviewAccount>,
    
    #[account(
        init_if_needed,
        payer = reviewer,
        space = 8 + size_of::<ReviewerAccount>(),
        seeds = [REVIEWER_SEED, reviewer.key().as_ref()],
        bump
    )]
    pub reviewer_account: Account<'info, ReviewerAccount>,
    
    #[account(mut)]
    pub task_account: Account<'info, TaskAccount>,
    
    #[account(mut)]
    pub option_account: Account<'info, OptionAccount>,
    
    #[account(mut)]
    pub reviewer: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

// Context for claiming earnings
#[derive(Accounts)]
pub struct ClaimEarnings<'info> {
    #[account(
        mut,
        seeds = [REVIEWER_SEED, reviewer.key().as_ref()],
        bump,
        constraint = reviewer_account.reviewer_address == reviewer.key() @ ErrorCode::Unauthorized
    )]
    pub reviewer_account: Account<'info, ReviewerAccount>,
    
    #[account(
        seeds = [PLATFORM_SEED],
        bump
    )]
    pub platform_account: Account<'info, PlatformAccount>,
    
    #[account(mut)]
    pub reviewer: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

// Context for updating task status
#[derive(Accounts)]
pub struct UpdateTaskStatus<'info> {
    #[account(mut)]
    pub task_account: Account<'info, TaskAccount>,
    
    #[account(
        constraint = platform_account.authority == authority.key() @ ErrorCode::Unauthorized
    )]
    pub platform_account: Account<'info, PlatformAccount>,
    
    pub authority: Signer<'info>,
}

// Context for refunding remaining funds
#[derive(Accounts)]
pub struct RefundRemainingFunds<'info> {
    #[account(
        mut,
        seeds = [TASK_SEED, creator.key().as_ref(), &task_account.external_id.to_le_bytes()],
        bump,
        constraint = task_account.creator == creator.key() @ ErrorCode::Unauthorized
    )]
    pub task_account: Account<'info, TaskAccount>,
    
    #[account(mut)]
    pub creator: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

// Context for setting platform pause state
#[derive(Accounts)]
pub struct SetPlatformPause<'info> {
    #[account(
        mut,
        seeds = [PLATFORM_SEED],
        bump,
        constraint = platform_account.authority == authority.key() @ ErrorCode::Unauthorized
    )]
    pub platform_account: Account<'info, PlatformAccount>,
    
    pub authority: Signer<'info>,
}

// Platform account structure
#[account]
pub struct PlatformAccount {
    pub authority: Pubkey,
    pub fee_percentage: u16,
    pub total_tasks: u64,
    pub total_fees_collected: u64,
    pub is_paused: bool,
}

// Task account structure
#[account]
pub struct TaskAccount {
    pub creator: Pubkey,
    pub title: String,
    pub amount: u64,
    pub amount_per_review: u64,
    pub total_reviews_required: u32,
    pub reviews_completed: u32,
    pub created_at: i64,
    pub expires_at: i64,
    pub status: u8,
    pub external_id: u64,
    pub option_count: u32,
}

// Option account structure
#[account]
pub struct OptionAccount {
    pub task: Pubkey,
    pub option_id: u32,
    pub metadata_hash: String,
    pub vote_count: u32,
}

// Review account structure
#[account]
pub struct ReviewAccount {
    pub task: Pubkey,
    pub reviewer: Pubkey,
    pub selected_option: u32,
    pub amount: u64,
    pub submitted_at: i64,
    pub payment_status: u8,
    pub external_id: u64,
}

// Reviewer account structure
#[account]
pub struct ReviewerAccount {
    pub reviewer_address: Pubkey,
    pub total_reviews: u32,
    pub pending_amount: u64,
    pub total_earned: u64,
    pub last_review_at: i64,
    pub external_id: u64,
}