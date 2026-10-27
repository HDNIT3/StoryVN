import type { Metadata } from "next";
import { FollowsView } from "@/features/follows";

export const metadata: Metadata = {
  title: "Tủ truyện | StoryVN",
  description: "Tủ truyện và tác giả bạn đang theo dõi trên StoryVN.",
};

export default function TheoDoiAliasPage() {
  return <FollowsView />;
}
