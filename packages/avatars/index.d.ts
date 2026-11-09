export interface NemayaAvatar {
  id: string
  name: string
  svg: string
}

export declare const AVATARS: NemayaAvatar[]
export declare const AVATAR_IDS: string[]
export declare const DEFAULT_AVATAR_ID: string
export declare function getAvatar(id: string | null | undefined): NemayaAvatar
export declare function isValidAvatarId(id: unknown): id is string
export declare function avatarDataUri(id: string | null | undefined): string
