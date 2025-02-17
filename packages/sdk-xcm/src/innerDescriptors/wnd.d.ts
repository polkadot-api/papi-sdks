import { PlainDescriptor, TxDescriptor, RuntimeDescriptor, Enum, QueryFromPalletsDef, TxFromPalletsDef, EventsFromPalletsDef, ErrorsFromPalletsDef, ConstFromPalletsDef, Binary, FixedSizeBinary, FixedSizeArray } from "polkadot-api";
import { Iegif7m3upfe1k, BagsListListListError, Ie2db4l6126rkt, Iftvbctbo05fu4, XcmVersionedXcm, Ic0c3req3mlc1l, I4q39t5hn830vp, XcmVersionedAssetId, I7ocn4njqde3v5, XcmVersionedLocation, Iek7ha36da9mf5, Icgo40grj87fvv, I9pj05c1lp8ovg, I7cepa2p9in6va, I199qcq7uh9tib } from "./common-types";
type AnonymousEnum<T extends {}> = T & {
    __anonymous: true;
};
type MyTuple<T> = [T, ...T[]];
type SeparateUndefined<T> = undefined extends T ? undefined | Exclude<T, undefined> : T;
type Anonymize<T> = SeparateUndefined<T extends FixedSizeBinary<infer L> ? number extends L ? Binary : FixedSizeBinary<L> : T extends string | number | bigint | boolean | void | undefined | null | symbol | Uint8Array | Enum<any> ? T : T extends AnonymousEnum<infer V> ? Enum<V> : T extends MyTuple<any> ? {
    [K in keyof T]: T[K];
} : T extends [] ? [] : T extends FixedSizeArray<infer L, infer T> ? number extends L ? Array<T> : FixedSizeArray<L, T> : {
    [K in keyof T & string]: T[K];
}>;
type IStorage = {};
type ICalls = {
    XcmPallet: {
        /**
         *Execute an XCM message from a local, signed, origin.
         *
         *An event is deposited indicating whether `msg` could be executed completely or only
         *partially.
         *
         *No more than `max_weight` will be used in its attempted execution. If this is less than
         *the maximum amount of weight that the message could take to be executed, then no
         *execution attempt will be made.
         */
        execute: TxDescriptor<Anonymize<Iegif7m3upfe1k>>;
    };
};
type IEvent = {};
type IError = {
    System: {
        /**
         *The name of specification does not match between the current runtime
         *and the new runtime.
         */
        InvalidSpecName: PlainDescriptor<undefined>;
        /**
         *The specification version is not allowed to decrease between the current runtime
         *and the new runtime.
         */
        SpecVersionNeedsToIncrease: PlainDescriptor<undefined>;
        /**
         *Failed to extract the runtime version from the new runtime.
         *
         *Either calling `Core_version` or decoding `RuntimeVersion` failed.
         */
        FailedToExtractRuntimeVersion: PlainDescriptor<undefined>;
        /**
         *Suicide called when the account has non-default composite data.
         */
        NonDefaultComposite: PlainDescriptor<undefined>;
        /**
         *There is a non-zero reference count preventing the account from being purged.
         */
        NonZeroRefCount: PlainDescriptor<undefined>;
        /**
         *The origin filter prevent the call to be dispatched.
         */
        CallFiltered: PlainDescriptor<undefined>;
        /**
         *A multi-block migration is ongoing and prevents the current code from being replaced.
         */
        MultiBlockMigrationsOngoing: PlainDescriptor<undefined>;
        /**
         *No upgrade authorized.
         */
        NothingAuthorized: PlainDescriptor<undefined>;
        /**
         *The submitted code is not authorized.
         */
        Unauthorized: PlainDescriptor<undefined>;
    };
    Babe: {
        /**
         *An equivocation proof provided as part of an equivocation report is invalid.
         */
        InvalidEquivocationProof: PlainDescriptor<undefined>;
        /**
         *A key ownership proof provided as part of an equivocation report is invalid.
         */
        InvalidKeyOwnershipProof: PlainDescriptor<undefined>;
        /**
         *A given equivocation report is valid but already previously reported.
         */
        DuplicateOffenceReport: PlainDescriptor<undefined>;
        /**
         *Submitted configuration is invalid.
         */
        InvalidConfiguration: PlainDescriptor<undefined>;
    };
    Indices: {
        /**
         *The index was not already assigned.
         */
        NotAssigned: PlainDescriptor<undefined>;
        /**
         *The index is assigned to another account.
         */
        NotOwner: PlainDescriptor<undefined>;
        /**
         *The index was not available.
         */
        InUse: PlainDescriptor<undefined>;
        /**
         *The source and destination accounts are identical.
         */
        NotTransfer: PlainDescriptor<undefined>;
        /**
         *The index is permanent and may not be freed/changed.
         */
        Permanent: PlainDescriptor<undefined>;
    };
    Balances: {
        /**
         *Vesting balance too high to send value.
         */
        VestingBalance: PlainDescriptor<undefined>;
        /**
         *Account liquidity restrictions prevent withdrawal.
         */
        LiquidityRestrictions: PlainDescriptor<undefined>;
        /**
         *Balance too low to send value.
         */
        InsufficientBalance: PlainDescriptor<undefined>;
        /**
         *Value too low to create account due to existential deposit.
         */
        ExistentialDeposit: PlainDescriptor<undefined>;
        /**
         *Transfer/payment would kill account.
         */
        Expendability: PlainDescriptor<undefined>;
        /**
         *A vesting schedule already exists for this account.
         */
        ExistingVestingSchedule: PlainDescriptor<undefined>;
        /**
         *Beneficiary account must pre-exist.
         */
        DeadAccount: PlainDescriptor<undefined>;
        /**
         *Number of named reserves exceed `MaxReserves`.
         */
        TooManyReserves: PlainDescriptor<undefined>;
        /**
         *Number of holds exceed `VariantCountOf<T::RuntimeHoldReason>`.
         */
        TooManyHolds: PlainDescriptor<undefined>;
        /**
         *Number of freezes exceed `MaxFreezes`.
         */
        TooManyFreezes: PlainDescriptor<undefined>;
        /**
         *The issuance cannot be modified since it is already deactivated.
         */
        IssuanceDeactivated: PlainDescriptor<undefined>;
        /**
         *The delta cannot be zero.
         */
        DeltaZero: PlainDescriptor<undefined>;
    };
    Staking: {
        /**
         *Not a controller account.
         */
        NotController: PlainDescriptor<undefined>;
        /**
         *Not a stash account.
         */
        NotStash: PlainDescriptor<undefined>;
        /**
         *Stash is already bonded.
         */
        AlreadyBonded: PlainDescriptor<undefined>;
        /**
         *Controller is already paired.
         */
        AlreadyPaired: PlainDescriptor<undefined>;
        /**
         *Targets cannot be empty.
         */
        EmptyTargets: PlainDescriptor<undefined>;
        /**
         *Duplicate index.
         */
        DuplicateIndex: PlainDescriptor<undefined>;
        /**
         *Slash record index out of bounds.
         */
        InvalidSlashIndex: PlainDescriptor<undefined>;
        /**
         *Cannot have a validator or nominator role, with value less than the minimum defined by
         *governance (see `MinValidatorBond` and `MinNominatorBond`). If unbonding is the
         *intention, `chill` first to remove one's role as validator/nominator.
         */
        InsufficientBond: PlainDescriptor<undefined>;
        /**
         *Can not schedule more unlock chunks.
         */
        NoMoreChunks: PlainDescriptor<undefined>;
        /**
         *Can not rebond without unlocking chunks.
         */
        NoUnlockChunk: PlainDescriptor<undefined>;
        /**
         *Attempting to target a stash that still has funds.
         */
        FundedTarget: PlainDescriptor<undefined>;
        /**
         *Invalid era to reward.
         */
        InvalidEraToReward: PlainDescriptor<undefined>;
        /**
         *Invalid number of nominations.
         */
        InvalidNumberOfNominations: PlainDescriptor<undefined>;
        /**
         *Items are not sorted and unique.
         */
        NotSortedAndUnique: PlainDescriptor<undefined>;
        /**
         *Rewards for this era have already been claimed for this validator.
         */
        AlreadyClaimed: PlainDescriptor<undefined>;
        /**
         *No nominators exist on this page.
         */
        InvalidPage: PlainDescriptor<undefined>;
        /**
         *Incorrect previous history depth input provided.
         */
        IncorrectHistoryDepth: PlainDescriptor<undefined>;
        /**
         *Incorrect number of slashing spans provided.
         */
        IncorrectSlashingSpans: PlainDescriptor<undefined>;
        /**
         *Internal state has become somehow corrupted and the operation cannot continue.
         */
        BadState: PlainDescriptor<undefined>;
        /**
         *Too many nomination targets supplied.
         */
        TooManyTargets: PlainDescriptor<undefined>;
        /**
         *A nomination target was supplied that was blocked or otherwise not a validator.
         */
        BadTarget: PlainDescriptor<undefined>;
        /**
         *The user has enough bond and thus cannot be chilled forcefully by an external person.
         */
        CannotChillOther: PlainDescriptor<undefined>;
        /**
         *There are too many nominators in the system. Governance needs to adjust the staking
         *settings to keep things safe for the runtime.
         */
        TooManyNominators: PlainDescriptor<undefined>;
        /**
         *There are too many validator candidates in the system. Governance needs to adjust the
         *staking settings to keep things safe for the runtime.
         */
        TooManyValidators: PlainDescriptor<undefined>;
        /**
         *Commission is too low. Must be at least `MinCommission`.
         */
        CommissionTooLow: PlainDescriptor<undefined>;
        /**
         *Some bound is not met.
         */
        BoundNotMet: PlainDescriptor<undefined>;
        /**
         *Used when attempting to use deprecated controller account logic.
         */
        ControllerDeprecated: PlainDescriptor<undefined>;
        /**
         *Cannot reset a ledger.
         */
        CannotRestoreLedger: PlainDescriptor<undefined>;
        /**
         *Provided reward destination is not allowed.
         */
        RewardDestinationRestricted: PlainDescriptor<undefined>;
        /**
         *Not enough funds available to withdraw.
         */
        NotEnoughFunds: PlainDescriptor<undefined>;
        /**
         *Operation not allowed for virtual stakers.
         */
        VirtualStakerNotAllowed: PlainDescriptor<undefined>;
    };
    Session: {
        /**
         *Invalid ownership proof.
         */
        InvalidProof: PlainDescriptor<undefined>;
        /**
         *No associated validator ID for account.
         */
        NoAssociatedValidatorId: PlainDescriptor<undefined>;
        /**
         *Registered duplicate key.
         */
        DuplicatedKey: PlainDescriptor<undefined>;
        /**
         *No keys are associated with this account.
         */
        NoKeys: PlainDescriptor<undefined>;
        /**
         *Key setting account is not live, so it's impossible to associate keys.
         */
        NoAccount: PlainDescriptor<undefined>;
    };
    Grandpa: {
        /**
         *Attempt to signal GRANDPA pause when the authority set isn't live
         *(either paused or already pending pause).
         */
        PauseFailed: PlainDescriptor<undefined>;
        /**
         *Attempt to signal GRANDPA resume when the authority set isn't paused
         *(either live or already pending resume).
         */
        ResumeFailed: PlainDescriptor<undefined>;
        /**
         *Attempt to signal GRANDPA change with one already pending.
         */
        ChangePending: PlainDescriptor<undefined>;
        /**
         *Cannot signal forced change so soon after last.
         */
        TooSoon: PlainDescriptor<undefined>;
        /**
         *A key ownership proof provided as part of an equivocation report is invalid.
         */
        InvalidKeyOwnershipProof: PlainDescriptor<undefined>;
        /**
         *An equivocation proof provided as part of an equivocation report is invalid.
         */
        InvalidEquivocationProof: PlainDescriptor<undefined>;
        /**
         *A given equivocation report is valid but already previously reported.
         */
        DuplicateOffenceReport: PlainDescriptor<undefined>;
    };
    Utility: {
        /**
         *Too many calls batched.
         */
        TooManyCalls: PlainDescriptor<undefined>;
    };
    Identity: {
        /**
         *Too many subs-accounts.
         */
        TooManySubAccounts: PlainDescriptor<undefined>;
        /**
         *Account isn't found.
         */
        NotFound: PlainDescriptor<undefined>;
        /**
         *Account isn't named.
         */
        NotNamed: PlainDescriptor<undefined>;
        /**
         *Empty index.
         */
        EmptyIndex: PlainDescriptor<undefined>;
        /**
         *Fee is changed.
         */
        FeeChanged: PlainDescriptor<undefined>;
        /**
         *No identity found.
         */
        NoIdentity: PlainDescriptor<undefined>;
        /**
         *Sticky judgement.
         */
        StickyJudgement: PlainDescriptor<undefined>;
        /**
         *Judgement given.
         */
        JudgementGiven: PlainDescriptor<undefined>;
        /**
         *Invalid judgement.
         */
        InvalidJudgement: PlainDescriptor<undefined>;
        /**
         *The index is invalid.
         */
        InvalidIndex: PlainDescriptor<undefined>;
        /**
         *The target is invalid.
         */
        InvalidTarget: PlainDescriptor<undefined>;
        /**
         *Maximum amount of registrars reached. Cannot add any more.
         */
        TooManyRegistrars: PlainDescriptor<undefined>;
        /**
         *Account ID is already named.
         */
        AlreadyClaimed: PlainDescriptor<undefined>;
        /**
         *Sender is not a sub-account.
         */
        NotSub: PlainDescriptor<undefined>;
        /**
         *Sub-account isn't owned by sender.
         */
        NotOwned: PlainDescriptor<undefined>;
        /**
         *The provided judgement was for a different identity.
         */
        JudgementForDifferentIdentity: PlainDescriptor<undefined>;
        /**
         *Error that occurs when there is an issue paying for judgement.
         */
        JudgementPaymentFailed: PlainDescriptor<undefined>;
        /**
         *The provided suffix is too long.
         */
        InvalidSuffix: PlainDescriptor<undefined>;
        /**
         *The sender does not have permission to issue a username.
         */
        NotUsernameAuthority: PlainDescriptor<undefined>;
        /**
         *The authority cannot allocate any more usernames.
         */
        NoAllocation: PlainDescriptor<undefined>;
        /**
         *The signature on a username was not valid.
         */
        InvalidSignature: PlainDescriptor<undefined>;
        /**
         *Setting this username requires a signature, but none was provided.
         */
        RequiresSignature: PlainDescriptor<undefined>;
        /**
         *The username does not meet the requirements.
         */
        InvalidUsername: PlainDescriptor<undefined>;
        /**
         *The username is already taken.
         */
        UsernameTaken: PlainDescriptor<undefined>;
        /**
         *The requested username does not exist.
         */
        NoUsername: PlainDescriptor<undefined>;
        /**
         *The username cannot be forcefully removed because it can still be accepted.
         */
        NotExpired: PlainDescriptor<undefined>;
        /**
         *The username cannot be removed because it's still in the grace period.
         */
        TooEarly: PlainDescriptor<undefined>;
        /**
         *The username cannot be removed because it is not unbinding.
         */
        NotUnbinding: PlainDescriptor<undefined>;
        /**
         *The username cannot be unbound because it is already unbinding.
         */
        AlreadyUnbinding: PlainDescriptor<undefined>;
        /**
         *The action cannot be performed because of insufficient privileges (e.g. authority
         *trying to unbind a username provided by the system).
         */
        InsufficientPrivileges: PlainDescriptor<undefined>;
    };
    Recovery: {
        /**
         *User is not allowed to make a call on behalf of this account
         */
        NotAllowed: PlainDescriptor<undefined>;
        /**
         *Threshold must be greater than zero
         */
        ZeroThreshold: PlainDescriptor<undefined>;
        /**
         *Friends list must be greater than zero and threshold
         */
        NotEnoughFriends: PlainDescriptor<undefined>;
        /**
         *Friends list must be less than max friends
         */
        MaxFriends: PlainDescriptor<undefined>;
        /**
         *Friends list must be sorted and free of duplicates
         */
        NotSorted: PlainDescriptor<undefined>;
        /**
         *This account is not set up for recovery
         */
        NotRecoverable: PlainDescriptor<undefined>;
        /**
         *This account is already set up for recovery
         */
        AlreadyRecoverable: PlainDescriptor<undefined>;
        /**
         *A recovery process has already started for this account
         */
        AlreadyStarted: PlainDescriptor<undefined>;
        /**
         *A recovery process has not started for this rescuer
         */
        NotStarted: PlainDescriptor<undefined>;
        /**
         *This account is not a friend who can vouch
         */
        NotFriend: PlainDescriptor<undefined>;
        /**
         *The friend must wait until the delay period to vouch for this recovery
         */
        DelayPeriod: PlainDescriptor<undefined>;
        /**
         *This user has already vouched for this recovery
         */
        AlreadyVouched: PlainDescriptor<undefined>;
        /**
         *The threshold for recovering this account has not been met
         */
        Threshold: PlainDescriptor<undefined>;
        /**
         *There are still active recovery attempts that need to be closed
         */
        StillActive: PlainDescriptor<undefined>;
        /**
         *This account is already set up for recovery
         */
        AlreadyProxy: PlainDescriptor<undefined>;
        /**
         *Some internal state is broken.
         */
        BadState: PlainDescriptor<undefined>;
    };
    Vesting: {
        /**
         *The account given is not vesting.
         */
        NotVesting: PlainDescriptor<undefined>;
        /**
         *The account already has `MaxVestingSchedules` count of schedules and thus
         *cannot add another one. Consider merging existing schedules in order to add another.
         */
        AtMaxVestingSchedules: PlainDescriptor<undefined>;
        /**
         *Amount being transferred is too low to create a vesting schedule.
         */
        AmountLow: PlainDescriptor<undefined>;
        /**
         *An index was out of bounds of the vesting schedules.
         */
        ScheduleIndexOutOfBounds: PlainDescriptor<undefined>;
        /**
         *Failed to create a new schedule because some parameter was invalid.
         */
        InvalidScheduleParams: PlainDescriptor<undefined>;
    };
    Scheduler: {
        /**
         *Failed to schedule a call
         */
        FailedToSchedule: PlainDescriptor<undefined>;
        /**
         *Cannot find the scheduled call.
         */
        NotFound: PlainDescriptor<undefined>;
        /**
         *Given target block number is in the past.
         */
        TargetBlockNumberInPast: PlainDescriptor<undefined>;
        /**
         *Reschedule failed because it does not change scheduled time.
         */
        RescheduleNoChange: PlainDescriptor<undefined>;
        /**
         *Attempt to use a non-named function on a named task.
         */
        Named: PlainDescriptor<undefined>;
    };
    Preimage: {
        /**
         *Preimage is too large to store on-chain.
         */
        TooBig: PlainDescriptor<undefined>;
        /**
         *Preimage has already been noted on-chain.
         */
        AlreadyNoted: PlainDescriptor<undefined>;
        /**
         *The user is not authorized to perform this action.
         */
        NotAuthorized: PlainDescriptor<undefined>;
        /**
         *The preimage cannot be removed since it has not yet been noted.
         */
        NotNoted: PlainDescriptor<undefined>;
        /**
         *A preimage may not be removed when there are outstanding requests.
         */
        Requested: PlainDescriptor<undefined>;
        /**
         *The preimage request cannot be removed since no outstanding requests exist.
         */
        NotRequested: PlainDescriptor<undefined>;
        /**
         *More than `MAX_HASH_UPGRADE_BULK_COUNT` hashes were requested to be upgraded at once.
         */
        TooMany: PlainDescriptor<undefined>;
        /**
         *Too few hashes were requested to be upgraded (i.e. zero).
         */
        TooFew: PlainDescriptor<undefined>;
    };
    Sudo: {
        /**
         *Sender must be the Sudo account.
         */
        RequireSudo: PlainDescriptor<undefined>;
    };
    Proxy: {
        /**
         *There are too many proxies registered or too many announcements pending.
         */
        TooMany: PlainDescriptor<undefined>;
        /**
         *Proxy registration not found.
         */
        NotFound: PlainDescriptor<undefined>;
        /**
         *Sender is not a proxy of the account to be proxied.
         */
        NotProxy: PlainDescriptor<undefined>;
        /**
         *A call which is incompatible with the proxy type's filter was attempted.
         */
        Unproxyable: PlainDescriptor<undefined>;
        /**
         *Account is already a proxy.
         */
        Duplicate: PlainDescriptor<undefined>;
        /**
         *Call may not be made by proxy because it may escalate its privileges.
         */
        NoPermission: PlainDescriptor<undefined>;
        /**
         *Announcement, if made at all, was made too recently.
         */
        Unannounced: PlainDescriptor<undefined>;
        /**
         *Cannot add self as proxy.
         */
        NoSelfProxy: PlainDescriptor<undefined>;
    };
    Multisig: {
        /**
         *Threshold must be 2 or greater.
         */
        MinimumThreshold: PlainDescriptor<undefined>;
        /**
         *Call is already approved by this signatory.
         */
        AlreadyApproved: PlainDescriptor<undefined>;
        /**
         *Call doesn't need any (more) approvals.
         */
        NoApprovalsNeeded: PlainDescriptor<undefined>;
        /**
         *There are too few signatories in the list.
         */
        TooFewSignatories: PlainDescriptor<undefined>;
        /**
         *There are too many signatories in the list.
         */
        TooManySignatories: PlainDescriptor<undefined>;
        /**
         *The signatories were provided out of order; they should be ordered.
         */
        SignatoriesOutOfOrder: PlainDescriptor<undefined>;
        /**
         *The sender was contained in the other signatories; it shouldn't be.
         */
        SenderInSignatories: PlainDescriptor<undefined>;
        /**
         *Multisig operation not found when attempting to cancel.
         */
        NotFound: PlainDescriptor<undefined>;
        /**
         *Only the account that originally created the multisig is able to cancel it.
         */
        NotOwner: PlainDescriptor<undefined>;
        /**
         *No timepoint was given, yet the multisig operation is already underway.
         */
        NoTimepoint: PlainDescriptor<undefined>;
        /**
         *A different timepoint was given to the multisig operation that is underway.
         */
        WrongTimepoint: PlainDescriptor<undefined>;
        /**
         *A timepoint was given, yet no multisig operation is underway.
         */
        UnexpectedTimepoint: PlainDescriptor<undefined>;
        /**
         *The maximum weight information provided was too low.
         */
        MaxWeightTooLow: PlainDescriptor<undefined>;
        /**
         *The data to be stored is already stored.
         */
        AlreadyStored: PlainDescriptor<undefined>;
    };
    ElectionProviderMultiPhase: {
        /**
         *Submission was too early.
         */
        PreDispatchEarlySubmission: PlainDescriptor<undefined>;
        /**
         *Wrong number of winners presented.
         */
        PreDispatchWrongWinnerCount: PlainDescriptor<undefined>;
        /**
         *Submission was too weak, score-wise.
         */
        PreDispatchWeakSubmission: PlainDescriptor<undefined>;
        /**
         *The queue was full, and the solution was not better than any of the existing ones.
         */
        SignedQueueFull: PlainDescriptor<undefined>;
        /**
         *The origin failed to pay the deposit.
         */
        SignedCannotPayDeposit: PlainDescriptor<undefined>;
        /**
         *Witness data to dispatchable is invalid.
         */
        SignedInvalidWitness: PlainDescriptor<undefined>;
        /**
         *The signed submission consumes too much weight
         */
        SignedTooMuchWeight: PlainDescriptor<undefined>;
        /**
         *OCW submitted solution for wrong round
         */
        OcwCallWrongEra: PlainDescriptor<undefined>;
        /**
         *Snapshot metadata should exist but didn't.
         */
        MissingSnapshotMetadata: PlainDescriptor<undefined>;
        /**
         *`Self::insert_submission` returned an invalid index.
         */
        InvalidSubmissionIndex: PlainDescriptor<undefined>;
        /**
         *The call is not allowed at this point.
         */
        CallNotAllowed: PlainDescriptor<undefined>;
        /**
         *The fallback failed
         */
        FallbackFailed: PlainDescriptor<undefined>;
        /**
         *Some bound not met
         */
        BoundNotMet: PlainDescriptor<undefined>;
        /**
         *Submitted solution has too many winners
         */
        TooManyWinners: PlainDescriptor<undefined>;
        /**
         *Submission was prepared for a different round.
         */
        PreDispatchDifferentRound: PlainDescriptor<undefined>;
    };
    VoterList: {
        /**
         *A error in the list interface implementation.
         */
        List: PlainDescriptor<BagsListListListError>;
    };
    NominationPools: {
        /**
         *A (bonded) pool id does not exist.
         */
        PoolNotFound: PlainDescriptor<undefined>;
        /**
         *An account is not a member.
         */
        PoolMemberNotFound: PlainDescriptor<undefined>;
        /**
         *A reward pool does not exist. In all cases this is a system logic error.
         */
        RewardPoolNotFound: PlainDescriptor<undefined>;
        /**
         *A sub pool does not exist.
         */
        SubPoolsNotFound: PlainDescriptor<undefined>;
        /**
         *An account is already delegating in another pool. An account may only belong to one
         *pool at a time.
         */
        AccountBelongsToOtherPool: PlainDescriptor<undefined>;
        /**
         *The member is fully unbonded (and thus cannot access the bonded and reward pool
         *anymore to, for example, collect rewards).
         */
        FullyUnbonding: PlainDescriptor<undefined>;
        /**
         *The member cannot unbond further chunks due to reaching the limit.
         */
        MaxUnbondingLimit: PlainDescriptor<undefined>;
        /**
         *None of the funds can be withdrawn yet because the bonding duration has not passed.
         */
        CannotWithdrawAny: PlainDescriptor<undefined>;
        /**
         *The amount does not meet the minimum bond to either join or create a pool.
         *
         *The depositor can never unbond to a value less than `Pallet::depositor_min_bond`. The
         *caller does not have nominating permissions for the pool. Members can never unbond to a
         *value below `MinJoinBond`.
         */
        MinimumBondNotMet: PlainDescriptor<undefined>;
        /**
         *The transaction could not be executed due to overflow risk for the pool.
         */
        OverflowRisk: PlainDescriptor<undefined>;
        /**
         *A pool must be in [`PoolState::Destroying`] in order for the depositor to unbond or for
         *other members to be permissionlessly unbonded.
         */
        NotDestroying: PlainDescriptor<undefined>;
        /**
         *The caller does not have nominating permissions for the pool.
         */
        NotNominator: PlainDescriptor<undefined>;
        /**
         *Either a) the caller cannot make a valid kick or b) the pool is not destroying.
         */
        NotKickerOrDestroying: PlainDescriptor<undefined>;
        /**
         *The pool is not open to join
         */
        NotOpen: PlainDescriptor<undefined>;
        /**
         *The system is maxed out on pools.
         */
        MaxPools: PlainDescriptor<undefined>;
        /**
         *Too many members in the pool or system.
         */
        MaxPoolMembers: PlainDescriptor<undefined>;
        /**
         *The pools state cannot be changed.
         */
        CanNotChangeState: PlainDescriptor<undefined>;
        /**
         *The caller does not have adequate permissions.
         */
        DoesNotHavePermission: PlainDescriptor<undefined>;
        /**
         *Metadata exceeds [`Config::MaxMetadataLen`]
         */
        MetadataExceedsMaxLen: PlainDescriptor<undefined>;
        /**
         *Some error occurred that should never happen. This should be reported to the
         *maintainers.
         */
        Defensive: PlainDescriptor<Anonymize<Ie2db4l6126rkt>>;
        /**
         *Partial unbonding now allowed permissionlessly.
         */
        PartialUnbondNotAllowedPermissionlessly: PlainDescriptor<undefined>;
        /**
         *The pool's max commission cannot be set higher than the existing value.
         */
        MaxCommissionRestricted: PlainDescriptor<undefined>;
        /**
         *The supplied commission exceeds the max allowed commission.
         */
        CommissionExceedsMaximum: PlainDescriptor<undefined>;
        /**
         *The supplied commission exceeds global maximum commission.
         */
        CommissionExceedsGlobalMaximum: PlainDescriptor<undefined>;
        /**
         *Not enough blocks have surpassed since the last commission update.
         */
        CommissionChangeThrottled: PlainDescriptor<undefined>;
        /**
         *The submitted changes to commission change rate are not allowed.
         */
        CommissionChangeRateNotAllowed: PlainDescriptor<undefined>;
        /**
         *There is no pending commission to claim.
         */
        NoPendingCommission: PlainDescriptor<undefined>;
        /**
         *No commission current has been set.
         */
        NoCommissionCurrentSet: PlainDescriptor<undefined>;
        /**
         *Pool id currently in use.
         */
        PoolIdInUse: PlainDescriptor<undefined>;
        /**
         *Pool id provided is not correct/usable.
         */
        InvalidPoolId: PlainDescriptor<undefined>;
        /**
         *Bonding extra is restricted to the exact pending reward amount.
         */
        BondExtraRestricted: PlainDescriptor<undefined>;
        /**
         *No imbalance in the ED deposit for the pool.
         */
        NothingToAdjust: PlainDescriptor<undefined>;
        /**
         *No slash pending that can be applied to the member.
         */
        NothingToSlash: PlainDescriptor<undefined>;
        /**
         *The pool or member delegation has already migrated to delegate stake.
         */
        AlreadyMigrated: PlainDescriptor<undefined>;
        /**
         *The pool or member delegation has not migrated yet to delegate stake.
         */
        NotMigrated: PlainDescriptor<undefined>;
        /**
         *This call is not allowed in the current state of the pallet.
         */
        NotSupported: PlainDescriptor<undefined>;
    };
    FastUnstake: {
        /**
         *The provided Controller account was not found.
         *
         *This means that the given account is not bonded.
         */
        NotController: PlainDescriptor<undefined>;
        /**
         *The bonded account has already been queued.
         */
        AlreadyQueued: PlainDescriptor<undefined>;
        /**
         *The bonded account has active unlocking chunks.
         */
        NotFullyBonded: PlainDescriptor<undefined>;
        /**
         *The provided un-staker is not in the `Queue`.
         */
        NotQueued: PlainDescriptor<undefined>;
        /**
         *The provided un-staker is already in Head, and cannot deregister.
         */
        AlreadyHead: PlainDescriptor<undefined>;
        /**
         *The call is not allowed at this point because the pallet is not active.
         */
        CallNotAllowed: PlainDescriptor<undefined>;
    };
    ConvictionVoting: {
        /**
         *Poll is not ongoing.
         */
        NotOngoing: PlainDescriptor<undefined>;
        /**
         *The given account did not vote on the poll.
         */
        NotVoter: PlainDescriptor<undefined>;
        /**
         *The actor has no permission to conduct the action.
         */
        NoPermission: PlainDescriptor<undefined>;
        /**
         *The actor has no permission to conduct the action right now but will do in the future.
         */
        NoPermissionYet: PlainDescriptor<undefined>;
        /**
         *The account is already delegating.
         */
        AlreadyDelegating: PlainDescriptor<undefined>;
        /**
         *The account currently has votes attached to it and the operation cannot succeed until
         *these are removed through `remove_vote`.
         */
        AlreadyVoting: PlainDescriptor<undefined>;
        /**
         *Too high a balance was provided that the account cannot afford.
         */
        InsufficientFunds: PlainDescriptor<undefined>;
        /**
         *The account is not currently delegating.
         */
        NotDelegating: PlainDescriptor<undefined>;
        /**
         *Delegation to oneself makes no sense.
         */
        Nonsense: PlainDescriptor<undefined>;
        /**
         *Maximum number of votes reached.
         */
        MaxVotesReached: PlainDescriptor<undefined>;
        /**
         *The class must be supplied since it is not easily determinable from the state.
         */
        ClassNeeded: PlainDescriptor<undefined>;
        /**
         *The class ID supplied is invalid.
         */
        BadClass: PlainDescriptor<undefined>;
    };
    Referenda: {
        /**
         *Referendum is not ongoing.
         */
        NotOngoing: PlainDescriptor<undefined>;
        /**
         *Referendum's decision deposit is already paid.
         */
        HasDeposit: PlainDescriptor<undefined>;
        /**
         *The track identifier given was invalid.
         */
        BadTrack: PlainDescriptor<undefined>;
        /**
         *There are already a full complement of referenda in progress for this track.
         */
        Full: PlainDescriptor<undefined>;
        /**
         *The queue of the track is empty.
         */
        QueueEmpty: PlainDescriptor<undefined>;
        /**
         *The referendum index provided is invalid in this context.
         */
        BadReferendum: PlainDescriptor<undefined>;
        /**
         *There was nothing to do in the advancement.
         */
        NothingToDo: PlainDescriptor<undefined>;
        /**
         *No track exists for the proposal origin.
         */
        NoTrack: PlainDescriptor<undefined>;
        /**
         *Any deposit cannot be refunded until after the decision is over.
         */
        Unfinished: PlainDescriptor<undefined>;
        /**
         *The deposit refunder is not the depositor.
         */
        NoPermission: PlainDescriptor<undefined>;
        /**
         *The deposit cannot be refunded since none was made.
         */
        NoDeposit: PlainDescriptor<undefined>;
        /**
         *The referendum status is invalid for this operation.
         */
        BadStatus: PlainDescriptor<undefined>;
        /**
         *The preimage does not exist.
         */
        PreimageNotExist: PlainDescriptor<undefined>;
        /**
         *The preimage is stored with a different length than the one provided.
         */
        PreimageStoredWithDifferentLength: PlainDescriptor<undefined>;
    };
    Whitelist: {
        /**
         *The preimage of the call hash could not be loaded.
         */
        UnavailablePreImage: PlainDescriptor<undefined>;
        /**
         *The call could not be decoded.
         */
        UndecodableCall: PlainDescriptor<undefined>;
        /**
         *The weight of the decoded call was higher than the witness.
         */
        InvalidCallWeightWitness: PlainDescriptor<undefined>;
        /**
         *The call was not whitelisted.
         */
        CallIsNotWhitelisted: PlainDescriptor<undefined>;
        /**
         *The call was already whitelisted; No-Op.
         */
        CallAlreadyWhitelisted: PlainDescriptor<undefined>;
    };
    Treasury: {
        /**
         *No proposal, bounty or spend at that index.
         */
        InvalidIndex: PlainDescriptor<undefined>;
        /**
         *Too many approvals in the queue.
         */
        TooManyApprovals: PlainDescriptor<undefined>;
        /**
         *The spend origin is valid but the amount it is allowed to spend is lower than the
         *amount to be spent.
         */
        InsufficientPermission: PlainDescriptor<undefined>;
        /**
         *Proposal has not been approved.
         */
        ProposalNotApproved: PlainDescriptor<undefined>;
        /**
         *The balance of the asset kind is not convertible to the balance of the native asset.
         */
        FailedToConvertBalance: PlainDescriptor<undefined>;
        /**
         *The spend has expired and cannot be claimed.
         */
        SpendExpired: PlainDescriptor<undefined>;
        /**
         *The spend is not yet eligible for payout.
         */
        EarlyPayout: PlainDescriptor<undefined>;
        /**
         *The payment has already been attempted.
         */
        AlreadyAttempted: PlainDescriptor<undefined>;
        /**
         *There was some issue with the mechanism of payment.
         */
        PayoutError: PlainDescriptor<undefined>;
        /**
         *The payout was not yet attempted/claimed.
         */
        NotAttempted: PlainDescriptor<undefined>;
        /**
         *The payment has neither failed nor succeeded yet.
         */
        Inconclusive: PlainDescriptor<undefined>;
    };
    DelegatedStaking: {
        /**
         *The account cannot perform this operation.
         */
        NotAllowed: PlainDescriptor<undefined>;
        /**
         *An existing staker cannot perform this action.
         */
        AlreadyStaking: PlainDescriptor<undefined>;
        /**
         *Reward Destination cannot be same as `Agent` account.
         */
        InvalidRewardDestination: PlainDescriptor<undefined>;
        /**
         *Delegation conditions are not met.
         *
         *Possible issues are
         *1) Cannot delegate to self,
         *2) Cannot delegate to multiple delegates.
         */
        InvalidDelegation: PlainDescriptor<undefined>;
        /**
         *The account does not have enough funds to perform the operation.
         */
        NotEnoughFunds: PlainDescriptor<undefined>;
        /**
         *Not an existing `Agent` account.
         */
        NotAgent: PlainDescriptor<undefined>;
        /**
         *Not a Delegator account.
         */
        NotDelegator: PlainDescriptor<undefined>;
        /**
         *Some corruption in internal state.
         */
        BadState: PlainDescriptor<undefined>;
        /**
         *Unapplied pending slash restricts operation on `Agent`.
         */
        UnappliedSlash: PlainDescriptor<undefined>;
        /**
         *`Agent` has no pending slash to be applied.
         */
        NothingToSlash: PlainDescriptor<undefined>;
        /**
         *Failed to withdraw amount from Core Staking.
         */
        WithdrawFailed: PlainDescriptor<undefined>;
        /**
         *Operation not supported by this pallet.
         */
        NotSupported: PlainDescriptor<undefined>;
    };
    Configuration: {
        /**
         *The new value for a configuration parameter is invalid.
         */
        InvalidNewValue: PlainDescriptor<undefined>;
    };
    ParaInclusion: {
        /**
         *Validator index out of bounds.
         */
        ValidatorIndexOutOfBounds: PlainDescriptor<undefined>;
        /**
         *Candidate submitted but para not scheduled.
         */
        UnscheduledCandidate: PlainDescriptor<undefined>;
        /**
         *Head data exceeds the configured maximum.
         */
        HeadDataTooLarge: PlainDescriptor<undefined>;
        /**
         *Code upgrade prematurely.
         */
        PrematureCodeUpgrade: PlainDescriptor<undefined>;
        /**
         *Output code is too large
         */
        NewCodeTooLarge: PlainDescriptor<undefined>;
        /**
         *The candidate's relay-parent was not allowed. Either it was
         *not recent enough or it didn't advance based on the last parachain block.
         */
        DisallowedRelayParent: PlainDescriptor<undefined>;
        /**
         *Failed to compute group index for the core: either it's out of bounds
         *or the relay parent doesn't belong to the current session.
         */
        InvalidAssignment: PlainDescriptor<undefined>;
        /**
         *Invalid group index in core assignment.
         */
        InvalidGroupIndex: PlainDescriptor<undefined>;
        /**
         *Insufficient (non-majority) backing.
         */
        InsufficientBacking: PlainDescriptor<undefined>;
        /**
         *Invalid (bad signature, unknown validator, etc.) backing.
         */
        InvalidBacking: PlainDescriptor<undefined>;
        /**
         *The validation data hash does not match expected.
         */
        ValidationDataHashMismatch: PlainDescriptor<undefined>;
        /**
         *The downward message queue is not processed correctly.
         */
        IncorrectDownwardMessageHandling: PlainDescriptor<undefined>;
        /**
         *At least one upward message sent does not pass the acceptance criteria.
         */
        InvalidUpwardMessages: PlainDescriptor<undefined>;
        /**
         *The candidate didn't follow the rules of HRMP watermark advancement.
         */
        HrmpWatermarkMishandling: PlainDescriptor<undefined>;
        /**
         *The HRMP messages sent by the candidate is not valid.
         */
        InvalidOutboundHrmp: PlainDescriptor<undefined>;
        /**
         *The validation code hash of the candidate is not valid.
         */
        InvalidValidationCodeHash: PlainDescriptor<undefined>;
        /**
         *The `para_head` hash in the candidate descriptor doesn't match the hash of the actual
         *para head in the commitments.
         */
        ParaHeadMismatch: PlainDescriptor<undefined>;
    };
    ParaInherent: {
        /**
         *Inclusion inherent called more than once per block.
         */
        TooManyInclusionInherents: PlainDescriptor<undefined>;
        /**
         *The hash of the submitted parent header doesn't correspond to the saved block hash of
         *the parent.
         */
        InvalidParentHeader: PlainDescriptor<undefined>;
        /**
         *Inherent data was filtered during execution. This should have only been done
         *during creation.
         */
        InherentDataFilteredDuringExecution: PlainDescriptor<undefined>;
        /**
         *Too many candidates supplied.
         */
        UnscheduledCandidate: PlainDescriptor<undefined>;
    };
    Paras: {
        /**
         *Para is not registered in our system.
         */
        NotRegistered: PlainDescriptor<undefined>;
        /**
         *Para cannot be onboarded because it is already tracked by our system.
         */
        CannotOnboard: PlainDescriptor<undefined>;
        /**
         *Para cannot be offboarded at this time.
         */
        CannotOffboard: PlainDescriptor<undefined>;
        /**
         *Para cannot be upgraded to a lease holding parachain.
         */
        CannotUpgrade: PlainDescriptor<undefined>;
        /**
         *Para cannot be downgraded to an on-demand parachain.
         */
        CannotDowngrade: PlainDescriptor<undefined>;
        /**
         *The statement for PVF pre-checking is stale.
         */
        PvfCheckStatementStale: PlainDescriptor<undefined>;
        /**
         *The statement for PVF pre-checking is for a future session.
         */
        PvfCheckStatementFuture: PlainDescriptor<undefined>;
        /**
         *Claimed validator index is out of bounds.
         */
        PvfCheckValidatorIndexOutOfBounds: PlainDescriptor<undefined>;
        /**
         *The signature for the PVF pre-checking is invalid.
         */
        PvfCheckInvalidSignature: PlainDescriptor<undefined>;
        /**
         *The given validator already has cast a vote.
         */
        PvfCheckDoubleVote: PlainDescriptor<undefined>;
        /**
         *The given PVF does not exist at the moment of process a vote.
         */
        PvfCheckSubjectInvalid: PlainDescriptor<undefined>;
        /**
         *Parachain cannot currently schedule a code upgrade.
         */
        CannotUpgradeCode: PlainDescriptor<undefined>;
        /**
         *Invalid validation code size.
         */
        InvalidCode: PlainDescriptor<undefined>;
    };
    Hrmp: {
        /**
         *The sender tried to open a channel to themselves.
         */
        OpenHrmpChannelToSelf: PlainDescriptor<undefined>;
        /**
         *The recipient is not a valid para.
         */
        OpenHrmpChannelInvalidRecipient: PlainDescriptor<undefined>;
        /**
         *The requested capacity is zero.
         */
        OpenHrmpChannelZeroCapacity: PlainDescriptor<undefined>;
        /**
         *The requested capacity exceeds the global limit.
         */
        OpenHrmpChannelCapacityExceedsLimit: PlainDescriptor<undefined>;
        /**
         *The requested maximum message size is 0.
         */
        OpenHrmpChannelZeroMessageSize: PlainDescriptor<undefined>;
        /**
         *The open request requested the message size that exceeds the global limit.
         */
        OpenHrmpChannelMessageSizeExceedsLimit: PlainDescriptor<undefined>;
        /**
         *The channel already exists
         */
        OpenHrmpChannelAlreadyExists: PlainDescriptor<undefined>;
        /**
         *There is already a request to open the same channel.
         */
        OpenHrmpChannelAlreadyRequested: PlainDescriptor<undefined>;
        /**
         *The sender already has the maximum number of allowed outbound channels.
         */
        OpenHrmpChannelLimitExceeded: PlainDescriptor<undefined>;
        /**
         *The channel from the sender to the origin doesn't exist.
         */
        AcceptHrmpChannelDoesntExist: PlainDescriptor<undefined>;
        /**
         *The channel is already confirmed.
         */
        AcceptHrmpChannelAlreadyConfirmed: PlainDescriptor<undefined>;
        /**
         *The recipient already has the maximum number of allowed inbound channels.
         */
        AcceptHrmpChannelLimitExceeded: PlainDescriptor<undefined>;
        /**
         *The origin tries to close a channel where it is neither the sender nor the recipient.
         */
        CloseHrmpChannelUnauthorized: PlainDescriptor<undefined>;
        /**
         *The channel to be closed doesn't exist.
         */
        CloseHrmpChannelDoesntExist: PlainDescriptor<undefined>;
        /**
         *The channel close request is already requested.
         */
        CloseHrmpChannelAlreadyUnderway: PlainDescriptor<undefined>;
        /**
         *Canceling is requested by neither the sender nor recipient of the open channel request.
         */
        CancelHrmpOpenChannelUnauthorized: PlainDescriptor<undefined>;
        /**
         *The open request doesn't exist.
         */
        OpenHrmpChannelDoesntExist: PlainDescriptor<undefined>;
        /**
         *Cannot cancel an HRMP open channel request because it is already confirmed.
         */
        OpenHrmpChannelAlreadyConfirmed: PlainDescriptor<undefined>;
        /**
         *The provided witness data is wrong.
         */
        WrongWitness: PlainDescriptor<undefined>;
        /**
         *The channel between these two chains cannot be authorized.
         */
        ChannelCreationNotAuthorized: PlainDescriptor<undefined>;
    };
    ParasDisputes: {
        /**
         *Duplicate dispute statement sets provided.
         */
        DuplicateDisputeStatementSets: PlainDescriptor<undefined>;
        /**
         *Ancient dispute statement provided.
         */
        AncientDisputeStatement: PlainDescriptor<undefined>;
        /**
         *Validator index on statement is out of bounds for session.
         */
        ValidatorIndexOutOfBounds: PlainDescriptor<undefined>;
        /**
         *Invalid signature on statement.
         */
        InvalidSignature: PlainDescriptor<undefined>;
        /**
         *Validator vote submitted more than once to dispute.
         */
        DuplicateStatement: PlainDescriptor<undefined>;
        /**
         *A dispute where there are only votes on one side.
         */
        SingleSidedDispute: PlainDescriptor<undefined>;
        /**
         *A dispute vote from a malicious backer.
         */
        MaliciousBacker: PlainDescriptor<undefined>;
        /**
         *No backing votes were provides along dispute statements.
         */
        MissingBackingVotes: PlainDescriptor<undefined>;
        /**
         *Unconfirmed dispute statement sets provided.
         */
        UnconfirmedDispute: PlainDescriptor<undefined>;
    };
    ParasSlashing: {
        /**
         *The key ownership proof is invalid.
         */
        InvalidKeyOwnershipProof: PlainDescriptor<undefined>;
        /**
         *The session index is too old or invalid.
         */
        InvalidSessionIndex: PlainDescriptor<undefined>;
        /**
         *The candidate hash is invalid.
         */
        InvalidCandidateHash: PlainDescriptor<undefined>;
        /**
         *There is no pending slash for the given validator index and time
         *slot.
         */
        InvalidValidatorIndex: PlainDescriptor<undefined>;
        /**
         *The validator index does not match the validator id.
         */
        ValidatorIndexIdMismatch: PlainDescriptor<undefined>;
        /**
         *The given slashing report is valid but already previously reported.
         */
        DuplicateSlashingReport: PlainDescriptor<undefined>;
    };
    OnDemandAssignmentProvider: {
        /**
         *The order queue is full, `place_order` will not continue.
         */
        QueueFull: PlainDescriptor<undefined>;
        /**
         *The current spot price is higher than the max amount specified in the `place_order`
         *call, making it invalid.
         */
        SpotPriceHigherThanMaxAmount: PlainDescriptor<undefined>;
    };
    CoretimeAssignmentProvider: {
        /**
        
         */
        AssignmentsEmpty: PlainDescriptor<undefined>;
        /**
         *assign_core is only allowed to append new assignments at the end of already existing
         *ones or update the last entry.
         */
        DisallowedInsert: PlainDescriptor<undefined>;
    };
    Registrar: {
        /**
         *The ID is not registered.
         */
        NotRegistered: PlainDescriptor<undefined>;
        /**
         *The ID is already registered.
         */
        AlreadyRegistered: PlainDescriptor<undefined>;
        /**
         *The caller is not the owner of this Id.
         */
        NotOwner: PlainDescriptor<undefined>;
        /**
         *Invalid para code size.
         */
        CodeTooLarge: PlainDescriptor<undefined>;
        /**
         *Invalid para head data size.
         */
        HeadDataTooLarge: PlainDescriptor<undefined>;
        /**
         *Para is not a Parachain.
         */
        NotParachain: PlainDescriptor<undefined>;
        /**
         *Para is not a Parathread (on-demand parachain).
         */
        NotParathread: PlainDescriptor<undefined>;
        /**
         *Cannot deregister para
         */
        CannotDeregister: PlainDescriptor<undefined>;
        /**
         *Cannot schedule downgrade of lease holding parachain to on-demand parachain
         */
        CannotDowngrade: PlainDescriptor<undefined>;
        /**
         *Cannot schedule upgrade of on-demand parachain to lease holding parachain
         */
        CannotUpgrade: PlainDescriptor<undefined>;
        /**
         *Para is locked from manipulation by the manager. Must use parachain or relay chain
         *governance.
         */
        ParaLocked: PlainDescriptor<undefined>;
        /**
         *The ID given for registration has not been reserved.
         */
        NotReserved: PlainDescriptor<undefined>;
        /**
         *The validation code is invalid.
         */
        InvalidCode: PlainDescriptor<undefined>;
        /**
         *Cannot perform a parachain slot / lifecycle swap. Check that the state of both paras
         *are correct for the swap to work.
         */
        CannotSwap: PlainDescriptor<undefined>;
    };
    Slots: {
        /**
         *The parachain ID is not onboarding.
         */
        ParaNotOnboarding: PlainDescriptor<undefined>;
        /**
         *There was an error with the lease.
         */
        LeaseError: PlainDescriptor<undefined>;
    };
    ParasSudoWrapper: {
        /**
         *The specified parachain is not registered.
         */
        ParaDoesntExist: PlainDescriptor<undefined>;
        /**
         *The specified parachain is already registered.
         */
        ParaAlreadyExists: PlainDescriptor<undefined>;
        /**
         *A DMP message couldn't be sent because it exceeds the maximum size allowed for a
         *downward message.
         */
        ExceedsMaxMessageSize: PlainDescriptor<undefined>;
        /**
         *Could not schedule para cleanup.
         */
        CouldntCleanup: PlainDescriptor<undefined>;
        /**
         *Not a parathread (on-demand parachain).
         */
        NotParathread: PlainDescriptor<undefined>;
        /**
         *Not a lease holding parachain.
         */
        NotParachain: PlainDescriptor<undefined>;
        /**
         *Cannot upgrade on-demand parachain to lease holding parachain.
         */
        CannotUpgrade: PlainDescriptor<undefined>;
        /**
         *Cannot downgrade lease holding parachain to on-demand.
         */
        CannotDowngrade: PlainDescriptor<undefined>;
        /**
         *There are more cores than supported by the runtime.
         */
        TooManyCores: PlainDescriptor<undefined>;
    };
    Auctions: {
        /**
         *This auction is already in progress.
         */
        AuctionInProgress: PlainDescriptor<undefined>;
        /**
         *The lease period is in the past.
         */
        LeasePeriodInPast: PlainDescriptor<undefined>;
        /**
         *Para is not registered
         */
        ParaNotRegistered: PlainDescriptor<undefined>;
        /**
         *Not a current auction.
         */
        NotCurrentAuction: PlainDescriptor<undefined>;
        /**
         *Not an auction.
         */
        NotAuction: PlainDescriptor<undefined>;
        /**
         *Auction has already ended.
         */
        AuctionEnded: PlainDescriptor<undefined>;
        /**
         *The para is already leased out for part of this range.
         */
        AlreadyLeasedOut: PlainDescriptor<undefined>;
    };
    Crowdloan: {
        /**
         *The current lease period is more than the first lease period.
         */
        FirstPeriodInPast: PlainDescriptor<undefined>;
        /**
         *The first lease period needs to at least be less than 3 `max_value`.
         */
        FirstPeriodTooFarInFuture: PlainDescriptor<undefined>;
        /**
         *Last lease period must be greater than first lease period.
         */
        LastPeriodBeforeFirstPeriod: PlainDescriptor<undefined>;
        /**
         *The last lease period cannot be more than 3 periods after the first period.
         */
        LastPeriodTooFarInFuture: PlainDescriptor<undefined>;
        /**
         *The campaign ends before the current block number. The end must be in the future.
         */
        CannotEndInPast: PlainDescriptor<undefined>;
        /**
         *The end date for this crowdloan is not sensible.
         */
        EndTooFarInFuture: PlainDescriptor<undefined>;
        /**
         *There was an overflow.
         */
        Overflow: PlainDescriptor<undefined>;
        /**
         *The contribution was below the minimum, `MinContribution`.
         */
        ContributionTooSmall: PlainDescriptor<undefined>;
        /**
         *Invalid fund index.
         */
        InvalidParaId: PlainDescriptor<undefined>;
        /**
         *Contributions exceed maximum amount.
         */
        CapExceeded: PlainDescriptor<undefined>;
        /**
         *The contribution period has already ended.
         */
        ContributionPeriodOver: PlainDescriptor<undefined>;
        /**
         *The origin of this call is invalid.
         */
        InvalidOrigin: PlainDescriptor<undefined>;
        /**
         *This crowdloan does not correspond to a parachain.
         */
        NotParachain: PlainDescriptor<undefined>;
        /**
         *This parachain lease is still active and retirement cannot yet begin.
         */
        LeaseActive: PlainDescriptor<undefined>;
        /**
         *This parachain's bid or lease is still active and withdraw cannot yet begin.
         */
        BidOrLeaseActive: PlainDescriptor<undefined>;
        /**
         *The crowdloan has not yet ended.
         */
        FundNotEnded: PlainDescriptor<undefined>;
        /**
         *There are no contributions stored in this crowdloan.
         */
        NoContributions: PlainDescriptor<undefined>;
        /**
         *The crowdloan is not ready to dissolve. Potentially still has a slot or in retirement
         *period.
         */
        NotReadyToDissolve: PlainDescriptor<undefined>;
        /**
         *Invalid signature.
         */
        InvalidSignature: PlainDescriptor<undefined>;
        /**
         *The provided memo is too large.
         */
        MemoTooLarge: PlainDescriptor<undefined>;
        /**
         *The fund is already in `NewRaise`
         */
        AlreadyInNewRaise: PlainDescriptor<undefined>;
        /**
         *No contributions allowed during the VRF delay
         */
        VrfDelayInProgress: PlainDescriptor<undefined>;
        /**
         *A lease period has not started yet, due to an offset in the starting block.
         */
        NoLeasePeriod: PlainDescriptor<undefined>;
    };
    AssignedSlots: {
        /**
         *The specified parachain is not registered.
         */
        ParaDoesntExist: PlainDescriptor<undefined>;
        /**
         *Not a parathread (on-demand parachain).
         */
        NotParathread: PlainDescriptor<undefined>;
        /**
         *Cannot upgrade on-demand parachain to lease holding
         *parachain.
         */
        CannotUpgrade: PlainDescriptor<undefined>;
        /**
         *Cannot downgrade lease holding parachain to
         *on-demand.
         */
        CannotDowngrade: PlainDescriptor<undefined>;
        /**
         *Permanent or Temporary slot already assigned.
         */
        SlotAlreadyAssigned: PlainDescriptor<undefined>;
        /**
         *Permanent or Temporary slot has not been assigned.
         */
        SlotNotAssigned: PlainDescriptor<undefined>;
        /**
         *An ongoing lease already exists.
         */
        OngoingLeaseExists: PlainDescriptor<undefined>;
        /**
        
         */
        MaxPermanentSlotsExceeded: PlainDescriptor<undefined>;
        /**
        
         */
        MaxTemporarySlotsExceeded: PlainDescriptor<undefined>;
    };
    Coretime: {
        /**
         *The paraid making the call is not the coretime brokerage system parachain.
         */
        NotBroker: PlainDescriptor<undefined>;
        /**
         *Requested revenue information `when` parameter was in the future from the current
         *block height.
         */
        RequestedFutureRevenue: PlainDescriptor<undefined>;
        /**
         *Failed to transfer assets to the coretime chain
         */
        AssetTransferFailed: PlainDescriptor<undefined>;
    };
    MultiBlockMigrations: {
        /**
         *The operation cannot complete since some MBMs are ongoing.
         */
        Ongoing: PlainDescriptor<undefined>;
    };
    XcmPallet: {
        /**
         *The desired destination was unreachable, generally because there is a no way of routing
         *to it.
         */
        Unreachable: PlainDescriptor<undefined>;
        /**
         *There was some other issue (i.e. not to do with routing) in sending the message.
         *Perhaps a lack of space for buffering the message.
         */
        SendFailure: PlainDescriptor<undefined>;
        /**
         *The message execution fails the filter.
         */
        Filtered: PlainDescriptor<undefined>;
        /**
         *The message's weight could not be determined.
         */
        UnweighableMessage: PlainDescriptor<undefined>;
        /**
         *The destination `Location` provided cannot be inverted.
         */
        DestinationNotInvertible: PlainDescriptor<undefined>;
        /**
         *The assets to be sent are empty.
         */
        Empty: PlainDescriptor<undefined>;
        /**
         *Could not re-anchor the assets to declare the fees for the destination chain.
         */
        CannotReanchor: PlainDescriptor<undefined>;
        /**
         *Too many assets have been attempted for transfer.
         */
        TooManyAssets: PlainDescriptor<undefined>;
        /**
         *Origin is invalid for sending.
         */
        InvalidOrigin: PlainDescriptor<undefined>;
        /**
         *The version of the `Versioned` value used is not able to be interpreted.
         */
        BadVersion: PlainDescriptor<undefined>;
        /**
         *The given location could not be used (e.g. because it cannot be expressed in the
         *desired version of XCM).
         */
        BadLocation: PlainDescriptor<undefined>;
        /**
         *The referenced subscription could not be found.
         */
        NoSubscription: PlainDescriptor<undefined>;
        /**
         *The location is invalid since it already has a subscription from us.
         */
        AlreadySubscribed: PlainDescriptor<undefined>;
        /**
         *Could not check-out the assets for teleportation to the destination chain.
         */
        CannotCheckOutTeleport: PlainDescriptor<undefined>;
        /**
         *The owner does not own (all) of the asset that they wish to do the operation on.
         */
        LowBalance: PlainDescriptor<undefined>;
        /**
         *The asset owner has too many locks on the asset.
         */
        TooManyLocks: PlainDescriptor<undefined>;
        /**
         *The given account is not an identifiable sovereign account for any location.
         */
        AccountNotSovereign: PlainDescriptor<undefined>;
        /**
         *The operation required fees to be paid which the initiator could not meet.
         */
        FeesNotMet: PlainDescriptor<undefined>;
        /**
         *A remote lock with the corresponding data could not be found.
         */
        LockNotFound: PlainDescriptor<undefined>;
        /**
         *The unlock operation cannot succeed because there are still consumers of the lock.
         */
        InUse: PlainDescriptor<undefined>;
        /**
         *Invalid asset, reserve chain could not be determined for it.
         */
        InvalidAssetUnknownReserve: PlainDescriptor<undefined>;
        /**
         *Invalid asset, do not support remote asset reserves with different fees reserves.
         */
        InvalidAssetUnsupportedReserve: PlainDescriptor<undefined>;
        /**
         *Too many assets with different reserve locations have been attempted for transfer.
         */
        TooManyReserves: PlainDescriptor<undefined>;
        /**
         *Local XCM execution incomplete.
         */
        LocalExecutionIncomplete: PlainDescriptor<undefined>;
    };
    MessageQueue: {
        /**
         *Page is not reapable because it has items remaining to be processed and is not old
         *enough.
         */
        NotReapable: PlainDescriptor<undefined>;
        /**
         *Page to be reaped does not exist.
         */
        NoPage: PlainDescriptor<undefined>;
        /**
         *The referenced message could not be found.
         */
        NoMessage: PlainDescriptor<undefined>;
        /**
         *The message was already processed and cannot be processed again.
         */
        AlreadyProcessed: PlainDescriptor<undefined>;
        /**
         *The message is queued for future execution.
         */
        Queued: PlainDescriptor<undefined>;
        /**
         *There is temporarily not enough weight to continue servicing messages.
         */
        InsufficientWeight: PlainDescriptor<undefined>;
        /**
         *This message is temporarily unprocessable.
         *
         *Such errors are expected, but not guaranteed, to resolve themselves eventually through
         *retrying.
         */
        TemporarilyUnprocessable: PlainDescriptor<undefined>;
        /**
         *The queue is paused and no message can be executed from it.
         *
         *This can change at any time and may resolve in the future by re-trying.
         */
        QueuePaused: PlainDescriptor<undefined>;
        /**
         *Another call is in progress and needs to finish before this call can happen.
         */
        RecursiveDisallowed: PlainDescriptor<undefined>;
    };
    AssetRate: {
        /**
         *The given asset ID is unknown.
         */
        UnknownAssetKind: PlainDescriptor<undefined>;
        /**
         *The given asset ID already has an assigned conversion rate and cannot be re-created.
         */
        AlreadyExists: PlainDescriptor<undefined>;
        /**
         *Overflow ocurred when calculating the inverse rate.
         */
        Overflow: PlainDescriptor<undefined>;
    };
    Beefy: {
        /**
         *A key ownership proof provided as part of an equivocation report is invalid.
         */
        InvalidKeyOwnershipProof: PlainDescriptor<undefined>;
        /**
         *A double voting proof provided as part of an equivocation report is invalid.
         */
        InvalidDoubleVotingProof: PlainDescriptor<undefined>;
        /**
         *A fork voting proof provided as part of an equivocation report is invalid.
         */
        InvalidForkVotingProof: PlainDescriptor<undefined>;
        /**
         *A future block voting proof provided as part of an equivocation report is invalid.
         */
        InvalidFutureBlockVotingProof: PlainDescriptor<undefined>;
        /**
         *The session of the equivocation proof is invalid
         */
        InvalidEquivocationProofSession: PlainDescriptor<undefined>;
        /**
         *A given equivocation report is valid but already previously reported.
         */
        DuplicateOffenceReport: PlainDescriptor<undefined>;
        /**
         *Submitted configuration is invalid.
         */
        InvalidConfiguration: PlainDescriptor<undefined>;
    };
};
type IConstants = {};
type IRuntimeCalls = {
    /**
     * A trait of XCM payment API.
     *
     * API provides functionality for obtaining:
     *
     * * the weight required to execute an XCM message,
     * * a list of acceptable `AssetId`s for message execution payment,
     * * the cost of the weight in the specified acceptable `AssetId`.
     * * the fees for an XCM message delivery.
     *
     * To determine the execution weight of the calls required for
     * [`xcm::latest::Instruction::Transact`] instruction, `TransactionPaymentCallApi` can be used.
     */
    XcmPaymentApi: {
        /**
         * Returns a list of acceptable payment assets.
         *
         * # Arguments
         *
         * * `xcm_version`: Version.
         */
        query_acceptable_payment_assets: RuntimeDescriptor<[xcm_version: number], Anonymize<Iftvbctbo05fu4>>;
        /**
         * Returns a weight needed to execute a XCM.
         *
         * # Arguments
         *
         * * `message`: `VersionedXcm`.
         */
        query_xcm_weight: RuntimeDescriptor<[message: XcmVersionedXcm], Anonymize<Ic0c3req3mlc1l>>;
        /**
         * Converts a weight into a fee for the specified `AssetId`.
         *
         * # Arguments
         *
         * * `weight`: convertible `Weight`.
         * * `asset`: `VersionedAssetId`.
         */
        query_weight_to_asset_fee: RuntimeDescriptor<[weight: Anonymize<I4q39t5hn830vp>, asset: XcmVersionedAssetId], Anonymize<I7ocn4njqde3v5>>;
        /**
         * Get delivery fees for sending a specific `message` to a `destination`.
         * These always come in a specific asset, defined by the chain.
         *
         * # Arguments
         * * `message`: The message that'll be sent, necessary because most delivery fees are based on the
         *   size of the message.
         * * `destination`: The destination to send the message to. Different destinations may use
         *   different senders that charge different fees.
         */
        query_delivery_fees: RuntimeDescriptor<[destination: XcmVersionedLocation, message: XcmVersionedXcm], Anonymize<Iek7ha36da9mf5>>;
    };
    /**
     * API for dry-running extrinsics and XCM programs to get the programs that need to be passed to the fees API.
     *
     * All calls return a vector of tuples (location, xcm) where each "xcm" is executed in "location".
     * If there's local execution, the location will be "Here".
     * This vector can be used to calculate both execution and delivery fees.
     *
     * Calls or XCMs might fail when executed, this doesn't mean the result of these calls will be an `Err`.
     * In those cases, there might still be a valid result, with the execution error inside it.
     * The only reasons why these calls might return an error are listed in the [`Error`] enum.
     */
    DryRunApi: {
        /**
         * Dry run call.
         */
        dry_run_call: RuntimeDescriptor<[origin: Anonymize<Icgo40grj87fvv>, call: Anonymize<I9pj05c1lp8ovg>], Anonymize<I7cepa2p9in6va>>;
        /**
         * Dry run XCM program
         */
        dry_run_xcm: RuntimeDescriptor<[origin_location: XcmVersionedLocation, xcm: XcmVersionedXcm], Anonymize<I199qcq7uh9tib>>;
    };
};
type IAsset = PlainDescriptor<void>;
export type WndDispatchError = unknown;
type PalletsTypedef = {
    __storage: IStorage;
    __tx: ICalls;
    __event: IEvent;
    __error: IError;
    __const: IConstants;
};
type IDescriptors = {
    descriptors: {
        pallets: PalletsTypedef;
        apis: IRuntimeCalls;
    } & Promise<any>;
    metadataTypes: Promise<Uint8Array>;
    asset: IAsset;
    getMetadata: () => Promise<Uint8Array>;
    genesis: string | undefined;
};
declare const _allDescriptors: IDescriptors;
export default _allDescriptors;
export type WndQueries = QueryFromPalletsDef<PalletsTypedef>;
export type WndCalls = TxFromPalletsDef<PalletsTypedef>;
export type WndEvents = EventsFromPalletsDef<PalletsTypedef>;
export type WndErrors = ErrorsFromPalletsDef<PalletsTypedef>;
export type WndConstants = ConstFromPalletsDef<PalletsTypedef>;
export type WndCallData = Anonymize<I9pj05c1lp8ovg> & {
    value: {
        type: string;
    };
};
export type WndWhitelistEntry = PalletKey | ApiKey<IRuntimeCalls> | `query.${NestedKey<PalletsTypedef['__storage']>}` | `tx.${NestedKey<PalletsTypedef['__tx']>}` | `event.${NestedKey<PalletsTypedef['__event']>}` | `error.${NestedKey<PalletsTypedef['__error']>}` | `const.${NestedKey<PalletsTypedef['__const']>}`;
type PalletKey = `*.${keyof (IStorage & ICalls & IEvent & IError & IConstants & IRuntimeCalls)}`;
type NestedKey<D extends Record<string, Record<string, any>>> = "*" | {
    [P in keyof D & string]: `${P}.*` | {
        [N in keyof D[P] & string]: `${P}.${N}`;
    }[keyof D[P] & string];
}[keyof D & string];
type ApiKey<D extends Record<string, Record<string, any>>> = "api.*" | {
    [P in keyof D & string]: `api.${P}.*` | {
        [N in keyof D[P] & string]: `api.${P}.${N}`;
    }[keyof D[P] & string];
}[keyof D & string];
