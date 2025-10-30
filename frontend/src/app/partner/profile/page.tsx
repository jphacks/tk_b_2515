"use client";

import { Heart, User, Calendar, Clock, Save, Upload } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useId, useState } from "react";

export default function PartnerProfilePage() {
  // TODO: 実際のプロフィールデータをAPIから取得
  const [profile, setProfile] = useState({
    name: "",
    bio: "",
    age: "",
    university: "",
    major: "",
    hobbies: "",
    photoUrl: "",
  });

  const [availability, setAvailability] = useState({
    monday: { available: false, timeSlots: [] as string[] },
    tuesday: { available: false, timeSlots: [] as string[] },
    wednesday: { available: false, timeSlots: [] as string[] },
    thursday: { available: false, timeSlots: [] as string[] },
    friday: { available: false, timeSlots: [] as string[] },
    saturday: { available: false, timeSlots: [] as string[] },
    sunday: { available: false, timeSlots: [] as string[] },
  });

  const weekDays = [
    { key: "monday", label: "月曜日" },
    { key: "tuesday", label: "火曜日" },
    { key: "wednesday", label: "水曜日" },
    { key: "thursday", label: "木曜日" },
    { key: "friday", label: "金曜日" },
    { key: "saturday", label: "土曜日" },
    { key: "sunday", label: "日曜日" },
  ];

  const timeSlots = [
    "09:00-10:00",
    "10:00-11:00",
    "11:00-12:00",
    "12:00-13:00",
    "13:00-14:00",
    "14:00-15:00",
    "15:00-16:00",
    "16:00-17:00",
    "17:00-18:00",
    "18:00-19:00",
    "19:00-20:00",
    "20:00-21:00",
    "21:00-22:00",
  ];

  const handleProfileChange = (field: string, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleDayToggle = (day: string) => {
    setAvailability((prev) => ({
      ...prev,
      [day]: {
        ...prev[day as keyof typeof prev],
        available: !prev[day as keyof typeof prev].available,
      },
    }));
  };

  const handleTimeSlotToggle = (day: string, timeSlot: string) => {
    setAvailability((prev) => {
      const dayData = prev[day as keyof typeof prev];
      const timeSlots = dayData.timeSlots.includes(timeSlot)
        ? dayData.timeSlots.filter((t) => t !== timeSlot)
        : [...dayData.timeSlots, timeSlot];
      return {
        ...prev,
        [day]: { ...dayData, timeSlots },
      };
    });
  };

  const handleSave = () => {
    // TODO: APIにデータを送信
    console.log("Saving profile:", profile);
    console.log("Saving availability:", availability);
  };

  const idPrefix = useId();
  const nameInputId = `${idPrefix}-name`;
  const ageInputId = `${idPrefix}-age`;
  const universityInputId = `${idPrefix}-university`;
  const majorInputId = `${idPrefix}-major`;
  const hobbiesInputId = `${idPrefix}-hobbies`;
  const bioInputId = `${idPrefix}-bio`;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="p-4 bg-card/50 backdrop-blur-sm border-b border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link
            href="/partner"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <Heart className="w-6 h-6 text-primary fill-primary" />
            <span className="font-semibold text-foreground">
              恋ai パートナー
            </span>
          </Link>
          <Link href="/partner">
            <Button variant="ghost" size="sm" className="rounded-full">
              ダッシュボードに戻る
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
              プロフィール設定
            </h1>
            <p className="text-muted-foreground">
              あなたのプロフィールと対応可能時間を設定してください
            </p>
          </div>

          {/* Profile Information */}
          <Card className="p-6 border-2">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <User className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-bold text-foreground">基本情報</h2>
              </div>

              {/* Photo Upload */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  プロフィール写真
                </p>
                <div className="flex items-center gap-4">
                  {profile.photoUrl ? (
                    <div className="relative w-24 h-24 rounded-full bg-primary/10 overflow-hidden">
                      <Image
                        src={profile.photoUrl}
                        alt="プロフィール画像"
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-12 h-12 text-primary" />
                    </div>
                  )}
                  <Button variant="outline" className="rounded-full">
                    <Upload className="w-4 h-4 mr-2" />
                    写真をアップロード
                  </Button>
                </div>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-foreground"
                  htmlFor={nameInputId}
                >
                  ニックネーム <span className="text-red-500">*</span>
                </label>
                <input
                  id={nameInputId}
                  type="text"
                  value={profile.name}
                  onChange={(e) => handleProfileChange("name", e.target.value)}
                  placeholder="例: まゆ"
                  className="w-full px-4 py-2 rounded-lg border-2 border-border bg-background text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              {/* Age */}
              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-foreground"
                  htmlFor={ageInputId}
                >
                  年齢
                </label>
                <input
                  id={ageInputId}
                  type="text"
                  value={profile.age}
                  onChange={(e) => handleProfileChange("age", e.target.value)}
                  placeholder="例: 20"
                  className="w-full px-4 py-2 rounded-lg border-2 border-border bg-background text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              {/* University */}
              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-foreground"
                  htmlFor={universityInputId}
                >
                  大学
                </label>
                <input
                  id={universityInputId}
                  type="text"
                  value={profile.university}
                  onChange={(e) =>
                    handleProfileChange("university", e.target.value)
                  }
                  placeholder="例: 東京大学"
                  className="w-full px-4 py-2 rounded-lg border-2 border-border bg-background text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              {/* Major */}
              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-foreground"
                  htmlFor={majorInputId}
                >
                  専攻
                </label>
                <input
                  id={majorInputId}
                  type="text"
                  value={profile.major}
                  onChange={(e) => handleProfileChange("major", e.target.value)}
                  placeholder="例: 経済学部"
                  className="w-full px-4 py-2 rounded-lg border-2 border-border bg-background text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              {/* Hobbies */}
              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-foreground"
                  htmlFor={hobbiesInputId}
                >
                  趣味
                </label>
                <input
                  id={hobbiesInputId}
                  type="text"
                  value={profile.hobbies}
                  onChange={(e) =>
                    handleProfileChange("hobbies", e.target.value)
                  }
                  placeholder="例: 読書、旅行、カフェ巡り"
                  className="w-full px-4 py-2 rounded-lg border-2 border-border bg-background text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-foreground"
                  htmlFor={bioInputId}
                >
                  自己紹介
                </label>
                <textarea
                  id={bioInputId}
                  value={profile.bio}
                  onChange={(e) => handleProfileChange("bio", e.target.value)}
                  placeholder="あなたの魅力を伝える自己紹介を書いてください"
                  rows={4}
                  className="w-full px-4 py-2 rounded-lg border-2 border-border bg-background text-foreground focus:outline-none focus:border-primary resize-none"
                />
              </div>
            </div>
          </Card>

          {/* Availability Schedule */}
          <Card className="p-6 border-2">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Calendar className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-bold text-foreground">
                  対応可能時間
                </h2>
              </div>

              <div className="space-y-4">
                {weekDays.map((day) => {
                  const checkboxId = `${idPrefix}-${day.key}-availability`;
                  return (
                    <div key={day.key} className="space-y-3">
                      <div className="flex items-center gap-3">
                        <input
                          id={checkboxId}
                          type="checkbox"
                          checked={
                            availability[day.key as keyof typeof availability]
                              .available
                          }
                          onChange={() => handleDayToggle(day.key)}
                          className="w-5 h-5 rounded border-2 border-border"
                        />
                        <label
                          className="font-semibold text-foreground"
                          htmlFor={checkboxId}
                        >
                          {day.label}
                        </label>
                      </div>

                      {availability[day.key as keyof typeof availability]
                        .available && (
                        <div className="ml-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                          {timeSlots.map((slot) => {
                            const isSelected =
                              availability[
                                day.key as keyof typeof availability
                              ].timeSlots.includes(slot);
                            return (
                              <button
                                type="button"
                                key={slot}
                                onClick={() =>
                                  handleTimeSlotToggle(day.key, slot)
                                }
                                className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                                  isSelected
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-background text-foreground border-border hover:border-primary/50"
                                }`}
                              >
                                <Clock className="w-3 h-3 inline mr-1" />
                                {slot}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSave} size="lg" className="rounded-full">
              <Save className="w-5 h-5 mr-2" />
              保存する
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
