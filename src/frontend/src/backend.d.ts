import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export type Time = bigint;
export type TaskId = bigint;
export interface Task {
    id: TaskId;
    taskPhoto: ExternalBlob;
    title: string;
    creator: Principal;
    isCompleted: boolean;
    performer?: Principal;
    deadline?: Time;
    isVerified: boolean;
    safeSpot: string;
    telegramDiscussionEnabled: boolean;
    category: string;
    price: bigint;
    location: string;
    telegramHandle: string;
    verificationPhoto?: ExternalBlob;
}
export interface Profile {
    ratingSum: bigint;
    totalRatingsCount: bigint;
    ratingCount: bigint;
    tasksCompleted: bigint;
    averageRating: bigint;
    earnings: bigint;
    tasksPosted: bigint;
}
export interface UserProfile {
    gmailAddress?: string;
    name: string;
    postHistory: Array<TaskId>;
}
export enum Stars {
    one = "one",
    two = "two",
    three = "three",
    five = "five",
    four = "four"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    assignPerformer(taskId: TaskId): Promise<void>;
    completeTask(taskId: TaskId, photo: ExternalBlob): Promise<void>;
    createTask(title: string, category: string, price: bigint, location: string, safeSpot: string, telegramHandle: string, photo: ExternalBlob, deadline: Time | null): Promise<TaskId>;
    createUserProfileWithGoogle(name: string, gmailAddress: string): Promise<void>;
    deleteTask(taskId: TaskId): Promise<void>;
    getCallerProfile(): Promise<Profile>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCommentsForTask(_taskId: bigint): Promise<Array<[string, string, string]>>;
    getLeaderboard(): Promise<Array<Profile>>;
    getProfile(user: Principal): Promise<Profile>;
    getTasks(): Promise<Array<Task>>;
    getTasksByUser(user: Principal): Promise<Array<Task>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    searchTasks(search: string): Promise<Array<Task>>;
    toggleTelegramDiscussion(taskId: bigint, enabled: boolean): Promise<void>;
    updateUserProfile(name: string): Promise<void>;
    verifyTask(taskId: TaskId, rating: Stars, performer: Principal): Promise<void>;
}
