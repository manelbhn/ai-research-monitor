"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";
import { getAuthUser, getFollowedTopics, toggleFollowTopic } from "@/lib/client-auth";
import styles from "./FollowTopicButton.module.css";

type FollowTopicButtonProps = {
  topic: string;
};

export default function FollowTopicButton({ topic }: FollowTopicButtonProps) {
  const { t } = useAppPreferences();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const user = getAuthUser();
      const topics = getFollowedTopics();
      setIsLoggedIn(Boolean(user));
      setIsFollowing(topics.some((entry) => entry.label === topic));
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [topic]);

  const handleClick = () => {
    if (!isLoggedIn) {
      router.push(`/signup?redirect=/results&q=${encodeURIComponent(topic)}`);
      return;
    }

    const updated = toggleFollowTopic(topic);
    setIsFollowing(updated.some((entry) => entry.label === topic));
  };

  return (
    <button type="button" className={styles.followBtn} onClick={handleClick}>
      {isFollowing ? t("followFollowing") : t("followTopic")}
    </button>
  );
}
