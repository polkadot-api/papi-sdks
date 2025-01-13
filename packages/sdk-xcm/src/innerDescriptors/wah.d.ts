import { PlainDescriptor, TxDescriptor, RuntimeDescriptor, Enum, QueryFromPalletsDef, TxFromPalletsDef, EventsFromPalletsDef, ErrorsFromPalletsDef, ConstFromPalletsDef, Binary, FixedSizeBinary, FixedSizeArray } from "polkadot-api";
import { Iegif7m3upfe1k, Iftvbctbo05fu4, I3psnvvr3d6p0t, Ic0c3req3mlc1l, I4q39t5hn830vp, I47gh5t4ppbcdj, I7ocn4njqde3v5, Ichgaqm88qcdbe, Iek7ha36da9mf5, I59s4q2sbs1vv1, Ibuk047roov5v0, Ifbek2b2asmr7p, I6ftil0rrdh606, If9iqq7i64mur8 } from "./common-types";
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
    PolkadotXcm: {
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
    ParachainSystem: {
        /**
         *Attempt to upgrade validation function while existing upgrade pending.
         */
        OverlappingUpgrades: PlainDescriptor<undefined>;
        /**
         *Polkadot currently prohibits this parachain from upgrading its validation function.
         */
        ProhibitedByPolkadot: PlainDescriptor<undefined>;
        /**
         *The supplied validation function has compiled into a blob larger than Polkadot is
         *willing to run.
         */
        TooBig: PlainDescriptor<undefined>;
        /**
         *The inherent which supplies the validation data did not run this block.
         */
        ValidationDataNotAvailable: PlainDescriptor<undefined>;
        /**
         *The inherent which supplies the host configuration did not run this block.
         */
        HostConfigurationNotAvailable: PlainDescriptor<undefined>;
        /**
         *No validation function upgrade is currently scheduled.
         */
        NotScheduled: PlainDescriptor<undefined>;
        /**
         *No code upgrade has been authorized.
         */
        NothingAuthorized: PlainDescriptor<undefined>;
        /**
         *The given code upgrade has not been authorized.
         */
        Unauthorized: PlainDescriptor<undefined>;
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
    CollatorSelection: {
        /**
         *The pallet has too many candidates.
         */
        TooManyCandidates: PlainDescriptor<undefined>;
        /**
         *Leaving would result in too few candidates.
         */
        TooFewEligibleCollators: PlainDescriptor<undefined>;
        /**
         *Account is already a candidate.
         */
        AlreadyCandidate: PlainDescriptor<undefined>;
        /**
         *Account is not a candidate.
         */
        NotCandidate: PlainDescriptor<undefined>;
        /**
         *There are too many Invulnerables.
         */
        TooManyInvulnerables: PlainDescriptor<undefined>;
        /**
         *Account is already an Invulnerable.
         */
        AlreadyInvulnerable: PlainDescriptor<undefined>;
        /**
         *Account is not an Invulnerable.
         */
        NotInvulnerable: PlainDescriptor<undefined>;
        /**
         *Account has no associated validator ID.
         */
        NoAssociatedValidatorId: PlainDescriptor<undefined>;
        /**
         *Validator ID is not yet registered.
         */
        ValidatorNotRegistered: PlainDescriptor<undefined>;
        /**
         *Could not insert in the candidate list.
         */
        InsertToCandidateListFailed: PlainDescriptor<undefined>;
        /**
         *Could not remove from the candidate list.
         */
        RemoveFromCandidateListFailed: PlainDescriptor<undefined>;
        /**
         *New deposit amount would be below the minimum candidacy bond.
         */
        DepositTooLow: PlainDescriptor<undefined>;
        /**
         *Could not update the candidate list.
         */
        UpdateCandidateListFailed: PlainDescriptor<undefined>;
        /**
         *Deposit amount is too low to take the target's slot in the candidate list.
         */
        InsufficientBond: PlainDescriptor<undefined>;
        /**
         *The target account to be replaced in the candidate list is not a candidate.
         */
        TargetIsNotCandidate: PlainDescriptor<undefined>;
        /**
         *The updated deposit amount is equal to the amount already reserved.
         */
        IdenticalDeposit: PlainDescriptor<undefined>;
        /**
         *Cannot lower candidacy bond while occupying a future collator slot in the list.
         */
        InvalidUnreserve: PlainDescriptor<undefined>;
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
    XcmpQueue: {
        /**
         *Setting the queue config failed since one of its values was invalid.
         */
        BadQueueConfig: PlainDescriptor<undefined>;
        /**
         *The execution is already suspended.
         */
        AlreadySuspended: PlainDescriptor<undefined>;
        /**
         *The execution is already resumed.
         */
        AlreadyResumed: PlainDescriptor<undefined>;
        /**
         *There are too many active outbound channels.
         */
        TooManyActiveOutboundChannels: PlainDescriptor<undefined>;
        /**
         *The message is too big.
         */
        TooBig: PlainDescriptor<undefined>;
    };
    PolkadotXcm: {
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
    Utility: {
        /**
         *Too many calls batched.
         */
        TooManyCalls: PlainDescriptor<undefined>;
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
    Assets: {
        /**
         *Account balance must be greater than or equal to the transfer amount.
         */
        BalanceLow: PlainDescriptor<undefined>;
        /**
         *The account to alter does not exist.
         */
        NoAccount: PlainDescriptor<undefined>;
        /**
         *The signing account has no permission to do the operation.
         */
        NoPermission: PlainDescriptor<undefined>;
        /**
         *The given asset ID is unknown.
         */
        Unknown: PlainDescriptor<undefined>;
        /**
         *The origin account is frozen.
         */
        Frozen: PlainDescriptor<undefined>;
        /**
         *The asset ID is already taken.
         */
        InUse: PlainDescriptor<undefined>;
        /**
         *Invalid witness data given.
         */
        BadWitness: PlainDescriptor<undefined>;
        /**
         *Minimum balance should be non-zero.
         */
        MinBalanceZero: PlainDescriptor<undefined>;
        /**
         *Unable to increment the consumer reference counters on the account. Either no provider
         *reference exists to allow a non-zero balance of a non-self-sufficient asset, or one
         *fewer then the maximum number of consumers has been reached.
         */
        UnavailableConsumer: PlainDescriptor<undefined>;
        /**
         *Invalid metadata given.
         */
        BadMetadata: PlainDescriptor<undefined>;
        /**
         *No approval exists that would allow the transfer.
         */
        Unapproved: PlainDescriptor<undefined>;
        /**
         *The source account would not survive the transfer and it needs to stay alive.
         */
        WouldDie: PlainDescriptor<undefined>;
        /**
         *The asset-account already exists.
         */
        AlreadyExists: PlainDescriptor<undefined>;
        /**
         *The asset-account doesn't have an associated deposit.
         */
        NoDeposit: PlainDescriptor<undefined>;
        /**
         *The operation would result in funds being burned.
         */
        WouldBurn: PlainDescriptor<undefined>;
        /**
         *The asset is a live asset and is actively being used. Usually emit for operations such
         *as `start_destroy` which require the asset to be in a destroying state.
         */
        LiveAsset: PlainDescriptor<undefined>;
        /**
         *The asset is not live, and likely being destroyed.
         */
        AssetNotLive: PlainDescriptor<undefined>;
        /**
         *The asset status is not the expected status.
         */
        IncorrectStatus: PlainDescriptor<undefined>;
        /**
         *The asset should be frozen before the given operation.
         */
        NotFrozen: PlainDescriptor<undefined>;
        /**
         *Callback action resulted in error
         */
        CallbackFailed: PlainDescriptor<undefined>;
        /**
         *The asset ID must be equal to the [`NextAssetId`].
         */
        BadAssetId: PlainDescriptor<undefined>;
    };
    Uniques: {
        /**
         *The signing account has no permission to do the operation.
         */
        NoPermission: PlainDescriptor<undefined>;
        /**
         *The given item ID is unknown.
         */
        UnknownCollection: PlainDescriptor<undefined>;
        /**
         *The item ID has already been used for an item.
         */
        AlreadyExists: PlainDescriptor<undefined>;
        /**
         *The owner turned out to be different to what was expected.
         */
        WrongOwner: PlainDescriptor<undefined>;
        /**
         *Invalid witness data given.
         */
        BadWitness: PlainDescriptor<undefined>;
        /**
         *The item ID is already taken.
         */
        InUse: PlainDescriptor<undefined>;
        /**
         *The item or collection is frozen.
         */
        Frozen: PlainDescriptor<undefined>;
        /**
         *The delegate turned out to be different to what was expected.
         */
        WrongDelegate: PlainDescriptor<undefined>;
        /**
         *There is no delegate approved.
         */
        NoDelegate: PlainDescriptor<undefined>;
        /**
         *No approval exists that would allow the transfer.
         */
        Unapproved: PlainDescriptor<undefined>;
        /**
         *The named owner has not signed ownership of the collection is acceptable.
         */
        Unaccepted: PlainDescriptor<undefined>;
        /**
         *The item is locked.
         */
        Locked: PlainDescriptor<undefined>;
        /**
         *All items have been minted.
         */
        MaxSupplyReached: PlainDescriptor<undefined>;
        /**
         *The max supply has already been set.
         */
        MaxSupplyAlreadySet: PlainDescriptor<undefined>;
        /**
         *The provided max supply is less to the amount of items a collection already has.
         */
        MaxSupplyTooSmall: PlainDescriptor<undefined>;
        /**
         *The given item ID is unknown.
         */
        UnknownItem: PlainDescriptor<undefined>;
        /**
         *Item is not for sale.
         */
        NotForSale: PlainDescriptor<undefined>;
        /**
         *The provided bid is too low.
         */
        BidTooLow: PlainDescriptor<undefined>;
    };
    Nfts: {
        /**
         *The signing account has no permission to do the operation.
         */
        NoPermission: PlainDescriptor<undefined>;
        /**
         *The given item ID is unknown.
         */
        UnknownCollection: PlainDescriptor<undefined>;
        /**
         *The item ID has already been used for an item.
         */
        AlreadyExists: PlainDescriptor<undefined>;
        /**
         *The approval had a deadline that expired, so the approval isn't valid anymore.
         */
        ApprovalExpired: PlainDescriptor<undefined>;
        /**
         *The owner turned out to be different to what was expected.
         */
        WrongOwner: PlainDescriptor<undefined>;
        /**
         *The witness data given does not match the current state of the chain.
         */
        BadWitness: PlainDescriptor<undefined>;
        /**
         *Collection ID is already taken.
         */
        CollectionIdInUse: PlainDescriptor<undefined>;
        /**
         *Items within that collection are non-transferable.
         */
        ItemsNonTransferable: PlainDescriptor<undefined>;
        /**
         *The provided account is not a delegate.
         */
        NotDelegate: PlainDescriptor<undefined>;
        /**
         *The delegate turned out to be different to what was expected.
         */
        WrongDelegate: PlainDescriptor<undefined>;
        /**
         *No approval exists that would allow the transfer.
         */
        Unapproved: PlainDescriptor<undefined>;
        /**
         *The named owner has not signed ownership acceptance of the collection.
         */
        Unaccepted: PlainDescriptor<undefined>;
        /**
         *The item is locked (non-transferable).
         */
        ItemLocked: PlainDescriptor<undefined>;
        /**
         *Item's attributes are locked.
         */
        LockedItemAttributes: PlainDescriptor<undefined>;
        /**
         *Collection's attributes are locked.
         */
        LockedCollectionAttributes: PlainDescriptor<undefined>;
        /**
         *Item's metadata is locked.
         */
        LockedItemMetadata: PlainDescriptor<undefined>;
        /**
         *Collection's metadata is locked.
         */
        LockedCollectionMetadata: PlainDescriptor<undefined>;
        /**
         *All items have been minted.
         */
        MaxSupplyReached: PlainDescriptor<undefined>;
        /**
         *The max supply is locked and can't be changed.
         */
        MaxSupplyLocked: PlainDescriptor<undefined>;
        /**
         *The provided max supply is less than the number of items a collection already has.
         */
        MaxSupplyTooSmall: PlainDescriptor<undefined>;
        /**
         *The given item ID is unknown.
         */
        UnknownItem: PlainDescriptor<undefined>;
        /**
         *Swap doesn't exist.
         */
        UnknownSwap: PlainDescriptor<undefined>;
        /**
         *The given item has no metadata set.
         */
        MetadataNotFound: PlainDescriptor<undefined>;
        /**
         *The provided attribute can't be found.
         */
        AttributeNotFound: PlainDescriptor<undefined>;
        /**
         *Item is not for sale.
         */
        NotForSale: PlainDescriptor<undefined>;
        /**
         *The provided bid is too low.
         */
        BidTooLow: PlainDescriptor<undefined>;
        /**
         *The item has reached its approval limit.
         */
        ReachedApprovalLimit: PlainDescriptor<undefined>;
        /**
         *The deadline has already expired.
         */
        DeadlineExpired: PlainDescriptor<undefined>;
        /**
         *The duration provided should be less than or equal to `MaxDeadlineDuration`.
         */
        WrongDuration: PlainDescriptor<undefined>;
        /**
         *The method is disabled by system settings.
         */
        MethodDisabled: PlainDescriptor<undefined>;
        /**
         *The provided setting can't be set.
         */
        WrongSetting: PlainDescriptor<undefined>;
        /**
         *Item's config already exists and should be equal to the provided one.
         */
        InconsistentItemConfig: PlainDescriptor<undefined>;
        /**
         *Config for a collection or an item can't be found.
         */
        NoConfig: PlainDescriptor<undefined>;
        /**
         *Some roles were not cleared.
         */
        RolesNotCleared: PlainDescriptor<undefined>;
        /**
         *Mint has not started yet.
         */
        MintNotStarted: PlainDescriptor<undefined>;
        /**
         *Mint has already ended.
         */
        MintEnded: PlainDescriptor<undefined>;
        /**
         *The provided Item was already used for claiming.
         */
        AlreadyClaimed: PlainDescriptor<undefined>;
        /**
         *The provided data is incorrect.
         */
        IncorrectData: PlainDescriptor<undefined>;
        /**
         *The extrinsic was sent by the wrong origin.
         */
        WrongOrigin: PlainDescriptor<undefined>;
        /**
         *The provided signature is incorrect.
         */
        WrongSignature: PlainDescriptor<undefined>;
        /**
         *The provided metadata might be too long.
         */
        IncorrectMetadata: PlainDescriptor<undefined>;
        /**
         *Can't set more attributes per one call.
         */
        MaxAttributesLimitReached: PlainDescriptor<undefined>;
        /**
         *The provided namespace isn't supported in this call.
         */
        WrongNamespace: PlainDescriptor<undefined>;
        /**
         *Can't delete non-empty collections.
         */
        CollectionNotEmpty: PlainDescriptor<undefined>;
        /**
         *The witness data should be provided.
         */
        WitnessRequired: PlainDescriptor<undefined>;
    };
    ForeignAssets: {
        /**
         *Account balance must be greater than or equal to the transfer amount.
         */
        BalanceLow: PlainDescriptor<undefined>;
        /**
         *The account to alter does not exist.
         */
        NoAccount: PlainDescriptor<undefined>;
        /**
         *The signing account has no permission to do the operation.
         */
        NoPermission: PlainDescriptor<undefined>;
        /**
         *The given asset ID is unknown.
         */
        Unknown: PlainDescriptor<undefined>;
        /**
         *The origin account is frozen.
         */
        Frozen: PlainDescriptor<undefined>;
        /**
         *The asset ID is already taken.
         */
        InUse: PlainDescriptor<undefined>;
        /**
         *Invalid witness data given.
         */
        BadWitness: PlainDescriptor<undefined>;
        /**
         *Minimum balance should be non-zero.
         */
        MinBalanceZero: PlainDescriptor<undefined>;
        /**
         *Unable to increment the consumer reference counters on the account. Either no provider
         *reference exists to allow a non-zero balance of a non-self-sufficient asset, or one
         *fewer then the maximum number of consumers has been reached.
         */
        UnavailableConsumer: PlainDescriptor<undefined>;
        /**
         *Invalid metadata given.
         */
        BadMetadata: PlainDescriptor<undefined>;
        /**
         *No approval exists that would allow the transfer.
         */
        Unapproved: PlainDescriptor<undefined>;
        /**
         *The source account would not survive the transfer and it needs to stay alive.
         */
        WouldDie: PlainDescriptor<undefined>;
        /**
         *The asset-account already exists.
         */
        AlreadyExists: PlainDescriptor<undefined>;
        /**
         *The asset-account doesn't have an associated deposit.
         */
        NoDeposit: PlainDescriptor<undefined>;
        /**
         *The operation would result in funds being burned.
         */
        WouldBurn: PlainDescriptor<undefined>;
        /**
         *The asset is a live asset and is actively being used. Usually emit for operations such
         *as `start_destroy` which require the asset to be in a destroying state.
         */
        LiveAsset: PlainDescriptor<undefined>;
        /**
         *The asset is not live, and likely being destroyed.
         */
        AssetNotLive: PlainDescriptor<undefined>;
        /**
         *The asset status is not the expected status.
         */
        IncorrectStatus: PlainDescriptor<undefined>;
        /**
         *The asset should be frozen before the given operation.
         */
        NotFrozen: PlainDescriptor<undefined>;
        /**
         *Callback action resulted in error
         */
        CallbackFailed: PlainDescriptor<undefined>;
        /**
         *The asset ID must be equal to the [`NextAssetId`].
         */
        BadAssetId: PlainDescriptor<undefined>;
    };
    NftFractionalization: {
        /**
         *Asset ID does not correspond to locked NFT.
         */
        IncorrectAssetId: PlainDescriptor<undefined>;
        /**
         *The signing account has no permission to do the operation.
         */
        NoPermission: PlainDescriptor<undefined>;
        /**
         *NFT doesn't exist.
         */
        NftNotFound: PlainDescriptor<undefined>;
        /**
         *NFT has not yet been fractionalised.
         */
        NftNotFractionalized: PlainDescriptor<undefined>;
    };
    PoolAssets: {
        /**
         *Account balance must be greater than or equal to the transfer amount.
         */
        BalanceLow: PlainDescriptor<undefined>;
        /**
         *The account to alter does not exist.
         */
        NoAccount: PlainDescriptor<undefined>;
        /**
         *The signing account has no permission to do the operation.
         */
        NoPermission: PlainDescriptor<undefined>;
        /**
         *The given asset ID is unknown.
         */
        Unknown: PlainDescriptor<undefined>;
        /**
         *The origin account is frozen.
         */
        Frozen: PlainDescriptor<undefined>;
        /**
         *The asset ID is already taken.
         */
        InUse: PlainDescriptor<undefined>;
        /**
         *Invalid witness data given.
         */
        BadWitness: PlainDescriptor<undefined>;
        /**
         *Minimum balance should be non-zero.
         */
        MinBalanceZero: PlainDescriptor<undefined>;
        /**
         *Unable to increment the consumer reference counters on the account. Either no provider
         *reference exists to allow a non-zero balance of a non-self-sufficient asset, or one
         *fewer then the maximum number of consumers has been reached.
         */
        UnavailableConsumer: PlainDescriptor<undefined>;
        /**
         *Invalid metadata given.
         */
        BadMetadata: PlainDescriptor<undefined>;
        /**
         *No approval exists that would allow the transfer.
         */
        Unapproved: PlainDescriptor<undefined>;
        /**
         *The source account would not survive the transfer and it needs to stay alive.
         */
        WouldDie: PlainDescriptor<undefined>;
        /**
         *The asset-account already exists.
         */
        AlreadyExists: PlainDescriptor<undefined>;
        /**
         *The asset-account doesn't have an associated deposit.
         */
        NoDeposit: PlainDescriptor<undefined>;
        /**
         *The operation would result in funds being burned.
         */
        WouldBurn: PlainDescriptor<undefined>;
        /**
         *The asset is a live asset and is actively being used. Usually emit for operations such
         *as `start_destroy` which require the asset to be in a destroying state.
         */
        LiveAsset: PlainDescriptor<undefined>;
        /**
         *The asset is not live, and likely being destroyed.
         */
        AssetNotLive: PlainDescriptor<undefined>;
        /**
         *The asset status is not the expected status.
         */
        IncorrectStatus: PlainDescriptor<undefined>;
        /**
         *The asset should be frozen before the given operation.
         */
        NotFrozen: PlainDescriptor<undefined>;
        /**
         *Callback action resulted in error
         */
        CallbackFailed: PlainDescriptor<undefined>;
        /**
         *The asset ID must be equal to the [`NextAssetId`].
         */
        BadAssetId: PlainDescriptor<undefined>;
    };
    AssetConversion: {
        /**
         *Provided asset pair is not supported for pool.
         */
        InvalidAssetPair: PlainDescriptor<undefined>;
        /**
         *Pool already exists.
         */
        PoolExists: PlainDescriptor<undefined>;
        /**
         *Desired amount can't be zero.
         */
        WrongDesiredAmount: PlainDescriptor<undefined>;
        /**
         *Provided amount should be greater than or equal to the existential deposit/asset's
         *minimal amount.
         */
        AmountOneLessThanMinimal: PlainDescriptor<undefined>;
        /**
         *Provided amount should be greater than or equal to the existential deposit/asset's
         *minimal amount.
         */
        AmountTwoLessThanMinimal: PlainDescriptor<undefined>;
        /**
         *Reserve needs to always be greater than or equal to the existential deposit/asset's
         *minimal amount.
         */
        ReserveLeftLessThanMinimal: PlainDescriptor<undefined>;
        /**
         *Desired amount can't be equal to the pool reserve.
         */
        AmountOutTooHigh: PlainDescriptor<undefined>;
        /**
         *The pool doesn't exist.
         */
        PoolNotFound: PlainDescriptor<undefined>;
        /**
         *An overflow happened.
         */
        Overflow: PlainDescriptor<undefined>;
        /**
         *The minimal amount requirement for the first token in the pair wasn't met.
         */
        AssetOneDepositDidNotMeetMinimum: PlainDescriptor<undefined>;
        /**
         *The minimal amount requirement for the second token in the pair wasn't met.
         */
        AssetTwoDepositDidNotMeetMinimum: PlainDescriptor<undefined>;
        /**
         *The minimal amount requirement for the first token in the pair wasn't met.
         */
        AssetOneWithdrawalDidNotMeetMinimum: PlainDescriptor<undefined>;
        /**
         *The minimal amount requirement for the second token in the pair wasn't met.
         */
        AssetTwoWithdrawalDidNotMeetMinimum: PlainDescriptor<undefined>;
        /**
         *Optimal calculated amount is less than desired.
         */
        OptimalAmountLessThanDesired: PlainDescriptor<undefined>;
        /**
         *Insufficient liquidity minted.
         */
        InsufficientLiquidityMinted: PlainDescriptor<undefined>;
        /**
         *Requested liquidity can't be zero.
         */
        ZeroLiquidity: PlainDescriptor<undefined>;
        /**
         *Amount can't be zero.
         */
        ZeroAmount: PlainDescriptor<undefined>;
        /**
         *Calculated amount out is less than provided minimum amount.
         */
        ProvidedMinimumNotSufficientForSwap: PlainDescriptor<undefined>;
        /**
         *Provided maximum amount is not sufficient for swap.
         */
        ProvidedMaximumNotSufficientForSwap: PlainDescriptor<undefined>;
        /**
         *The provided path must consists of 2 assets at least.
         */
        InvalidPath: PlainDescriptor<undefined>;
        /**
         *The provided path must consists of unique assets.
         */
        NonUniquePath: PlainDescriptor<undefined>;
        /**
         *It was not possible to get or increment the Id of the pool.
         */
        IncorrectPoolAssetId: PlainDescriptor<undefined>;
        /**
         *The destination account cannot exist with the swapped funds.
         */
        BelowMinimum: PlainDescriptor<undefined>;
    };
    AssetsFreezer: {
        /**
         *Number of freezes on an account would exceed `MaxFreezes`.
         */
        TooManyFreezes: PlainDescriptor<undefined>;
    };
    ForeignAssetsFreezer: {
        /**
         *Number of freezes on an account would exceed `MaxFreezes`.
         */
        TooManyFreezes: PlainDescriptor<undefined>;
    };
    PoolAssetsFreezer: {
        /**
         *Number of freezes on an account would exceed `MaxFreezes`.
         */
        TooManyFreezes: PlainDescriptor<undefined>;
    };
    Revive: {
        /**
         *Invalid schedule supplied, e.g. with zero weight of a basic operation.
         */
        InvalidSchedule: PlainDescriptor<undefined>;
        /**
         *Invalid combination of flags supplied to `seal_call` or `seal_delegate_call`.
         */
        InvalidCallFlags: PlainDescriptor<undefined>;
        /**
         *The executed contract exhausted its gas limit.
         */
        OutOfGas: PlainDescriptor<undefined>;
        /**
         *Performing the requested transfer failed. Probably because there isn't enough
         *free balance in the sender's account.
         */
        TransferFailed: PlainDescriptor<undefined>;
        /**
         *Performing a call was denied because the calling depth reached the limit
         *of what is specified in the schedule.
         */
        MaxCallDepthReached: PlainDescriptor<undefined>;
        /**
         *No contract was found at the specified address.
         */
        ContractNotFound: PlainDescriptor<undefined>;
        /**
         *No code could be found at the supplied code hash.
         */
        CodeNotFound: PlainDescriptor<undefined>;
        /**
         *No code info could be found at the supplied code hash.
         */
        CodeInfoNotFound: PlainDescriptor<undefined>;
        /**
         *A buffer outside of sandbox memory was passed to a contract API function.
         */
        OutOfBounds: PlainDescriptor<undefined>;
        /**
         *Input passed to a contract API function failed to decode as expected type.
         */
        DecodingFailed: PlainDescriptor<undefined>;
        /**
         *Contract trapped during execution.
         */
        ContractTrapped: PlainDescriptor<undefined>;
        /**
         *The size defined in `T::MaxValueSize` was exceeded.
         */
        ValueTooLarge: PlainDescriptor<undefined>;
        /**
         *Termination of a contract is not allowed while the contract is already
         *on the call stack. Can be triggered by `seal_terminate`.
         */
        TerminatedWhileReentrant: PlainDescriptor<undefined>;
        /**
         *`seal_call` forwarded this contracts input. It therefore is no longer available.
         */
        InputForwarded: PlainDescriptor<undefined>;
        /**
         *The amount of topics passed to `seal_deposit_events` exceeds the limit.
         */
        TooManyTopics: PlainDescriptor<undefined>;
        /**
         *The chain does not provide a chain extension. Calling the chain extension results
         *in this error. Note that this usually  shouldn't happen as deploying such contracts
         *is rejected.
         */
        NoChainExtension: PlainDescriptor<undefined>;
        /**
         *Failed to decode the XCM program.
         */
        XCMDecodeFailed: PlainDescriptor<undefined>;
        /**
         *A contract with the same AccountId already exists.
         */
        DuplicateContract: PlainDescriptor<undefined>;
        /**
         *A contract self destructed in its constructor.
         *
         *This can be triggered by a call to `seal_terminate`.
         */
        TerminatedInConstructor: PlainDescriptor<undefined>;
        /**
         *A call tried to invoke a contract that is flagged as non-reentrant.
         */
        ReentranceDenied: PlainDescriptor<undefined>;
        /**
         *A contract called into the runtime which then called back into this pallet.
         */
        ReenteredPallet: PlainDescriptor<undefined>;
        /**
         *A contract attempted to invoke a state modifying API while being in read-only mode.
         */
        StateChangeDenied: PlainDescriptor<undefined>;
        /**
         *Origin doesn't have enough balance to pay the required storage deposits.
         */
        StorageDepositNotEnoughFunds: PlainDescriptor<undefined>;
        /**
         *More storage was created than allowed by the storage deposit limit.
         */
        StorageDepositLimitExhausted: PlainDescriptor<undefined>;
        /**
         *Code removal was denied because the code is still in use by at least one contract.
         */
        CodeInUse: PlainDescriptor<undefined>;
        /**
         *The contract ran to completion but decided to revert its storage changes.
         *Please note that this error is only returned from extrinsics. When called directly
         *or via RPC an `Ok` will be returned. In this case the caller needs to inspect the flags
         *to determine whether a reversion has taken place.
         */
        ContractReverted: PlainDescriptor<undefined>;
        /**
         *The contract failed to compile or is missing the correct entry points.
         *
         *A more detailed error can be found on the node console if debug messages are enabled
         *by supplying `-lruntime::revive=debug`.
         */
        CodeRejected: PlainDescriptor<undefined>;
        /**
         *The code blob supplied is larger than [`limits::code::BLOB_BYTES`].
         */
        BlobTooLarge: PlainDescriptor<undefined>;
        /**
         *The static memory consumption of the blob will be larger than
         *[`limits::code::STATIC_MEMORY_BYTES`].
         */
        StaticMemoryTooLarge: PlainDescriptor<undefined>;
        /**
         *The program contains a basic block that is larger than allowed.
         */
        BasicBlockTooLarge: PlainDescriptor<undefined>;
        /**
         *The program contains an invalid instruction.
         */
        InvalidInstruction: PlainDescriptor<undefined>;
        /**
         *The contract has reached its maximum number of delegate dependencies.
         */
        MaxDelegateDependenciesReached: PlainDescriptor<undefined>;
        /**
         *The dependency was not found in the contract's delegate dependencies.
         */
        DelegateDependencyNotFound: PlainDescriptor<undefined>;
        /**
         *The contract already depends on the given delegate dependency.
         */
        DelegateDependencyAlreadyExists: PlainDescriptor<undefined>;
        /**
         *Can not add a delegate dependency to the code hash of the contract itself.
         */
        CannotAddSelfAsDelegateDependency: PlainDescriptor<undefined>;
        /**
         *Can not add more data to transient storage.
         */
        OutOfTransientStorage: PlainDescriptor<undefined>;
        /**
         *The contract tried to call a syscall which does not exist (at its current api level).
         */
        InvalidSyscall: PlainDescriptor<undefined>;
        /**
         *Invalid storage flags were passed to one of the storage syscalls.
         */
        InvalidStorageFlags: PlainDescriptor<undefined>;
        /**
         *PolkaVM failed during code execution. Probably due to a malformed program.
         */
        ExecutionFailed: PlainDescriptor<undefined>;
        /**
         *Failed to convert a U256 to a Balance.
         */
        BalanceConversionFailed: PlainDescriptor<undefined>;
        /**
         *Immutable data can only be set during deploys and only be read during calls.
         *Additionally, it is only valid to set the data once and it must not be empty.
         */
        InvalidImmutableAccess: PlainDescriptor<undefined>;
        /**
         *An `AccountID32` account tried to interact with the pallet without having a mapping.
         *
         *Call [`Pallet::map_account`] in order to create a mapping for the account.
         */
        AccountUnmapped: PlainDescriptor<undefined>;
        /**
         *Tried to map an account that is already mapped.
         */
        AccountAlreadyMapped: PlainDescriptor<undefined>;
    };
    StateTrieMigration: {
        /**
         *Max signed limits not respected.
         */
        MaxSignedLimits: PlainDescriptor<undefined>;
        /**
         *A key was longer than the configured maximum.
         *
         *This means that the migration halted at the current [`Progress`] and
         *can be resumed with a larger [`crate::Config::MaxKeyLen`] value.
         *Retrying with the same [`crate::Config::MaxKeyLen`] value will not work.
         *The value should only be increased to avoid a storage migration for the currently
         *stored [`crate::Progress::LastKey`].
         */
        KeyTooLong: PlainDescriptor<undefined>;
        /**
         *submitter does not have enough funds.
         */
        NotEnoughFunds: PlainDescriptor<undefined>;
        /**
         *Bad witness data provided.
         */
        BadWitness: PlainDescriptor<undefined>;
        /**
         *Signed migration is not allowed because the maximum limit is not set yet.
         */
        SignedMigrationNotAllowed: PlainDescriptor<undefined>;
        /**
         *Bad child root provided.
         */
        BadChildRoot: PlainDescriptor<undefined>;
    };
    AssetConversionMigration: {
        /**
         *Provided asset pair is not supported for pool.
         */
        InvalidAssetPair: PlainDescriptor<undefined>;
        /**
         *The pool doesn't exist.
         */
        PoolNotFound: PlainDescriptor<undefined>;
        /**
         *Pool's balance cannot be zero.
         */
        ZeroBalance: PlainDescriptor<undefined>;
        /**
         *Indicates a partial transfer of balance to the new account during a migration.
         */
        PartialTransfer: PlainDescriptor<undefined>;
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
        query_xcm_weight: RuntimeDescriptor<[message: Anonymize<I3psnvvr3d6p0t>], Anonymize<Ic0c3req3mlc1l>>;
        /**
         * Converts a weight into a fee for the specified `AssetId`.
         *
         * # Arguments
         *
         * * `weight`: convertible `Weight`.
         * * `asset`: `VersionedAssetId`.
         */
        query_weight_to_asset_fee: RuntimeDescriptor<[weight: Anonymize<I4q39t5hn830vp>, asset: Anonymize<I47gh5t4ppbcdj>], Anonymize<I7ocn4njqde3v5>>;
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
        query_delivery_fees: RuntimeDescriptor<[destination: Anonymize<Ichgaqm88qcdbe>, message: Anonymize<I3psnvvr3d6p0t>], Anonymize<Iek7ha36da9mf5>>;
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
        dry_run_call: RuntimeDescriptor<[origin: Anonymize<I59s4q2sbs1vv1>, call: Anonymize<Ibuk047roov5v0>], Anonymize<Ifbek2b2asmr7p>>;
        /**
         * Dry run XCM program
         */
        dry_run_xcm: RuntimeDescriptor<[origin_location: Anonymize<Ichgaqm88qcdbe>, xcm: Anonymize<I3psnvvr3d6p0t>], Anonymize<I6ftil0rrdh606>>;
    };
};
type IAsset = PlainDescriptor<Anonymize<If9iqq7i64mur8>>;
export type WahDispatchError = unknown;
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
};
declare const _allDescriptors: IDescriptors;
export default _allDescriptors;
export type WahQueries = QueryFromPalletsDef<PalletsTypedef>;
export type WahCalls = TxFromPalletsDef<PalletsTypedef>;
export type WahEvents = EventsFromPalletsDef<PalletsTypedef>;
export type WahErrors = ErrorsFromPalletsDef<PalletsTypedef>;
export type WahConstants = ConstFromPalletsDef<PalletsTypedef>;
export type WahCallData = Anonymize<Ibuk047roov5v0> & {
    value: {
        type: string;
    };
};
export type WahWhitelistEntry = PalletKey | ApiKey<IRuntimeCalls> | `query.${NestedKey<PalletsTypedef['__storage']>}` | `tx.${NestedKey<PalletsTypedef['__tx']>}` | `event.${NestedKey<PalletsTypedef['__event']>}` | `error.${NestedKey<PalletsTypedef['__error']>}` | `const.${NestedKey<PalletsTypedef['__const']>}`;
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
