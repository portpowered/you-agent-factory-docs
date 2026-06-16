import type { SharedShellMessages } from "@/localization/messages/en";

type Join<K extends string, P extends string> = `${K}.${P}`;

type SharedShellMessagePaths<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends string
    ? Prefix extends ""
      ? K
      : Join<Prefix, K>
    : SharedShellMessagePaths<T[K], Prefix extends "" ? K : Join<Prefix, K>>;
}[keyof T & string];

/** Dot-separated keys for shared shell message lookup. */
export type SharedShellMessageKey =
  SharedShellMessagePaths<SharedShellMessages>;

export type { SharedShellMessages };
