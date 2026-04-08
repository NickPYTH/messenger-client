import { ProfileModel } from "entities/profile";

export type UserModel = {
    id: number;
    username: string;
    profile: ProfileModel;
};
