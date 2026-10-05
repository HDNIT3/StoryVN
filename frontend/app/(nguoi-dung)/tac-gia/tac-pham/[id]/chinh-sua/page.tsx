"use client";

import React from "react";
import { useParams } from "next/navigation";
import { MOCK_STORIES } from "@/lib/mock/stories.mock";
import { StoryStepForm } from "@/components/author/stories/StoryStepForm";

export default function ChinhSuaTacPhamPage() {
  const params = useParams();
  const storyId = params?.id as string;

  const existingStory =
    MOCK_STORIES.find((s) => s.id === storyId) || MOCK_STORIES[0];

  return <StoryStepForm isEdit={true} initialStory={existingStory} />;
}
