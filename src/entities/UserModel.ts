import { ProfileModel } from './ProfileModel';

export type UserModel = {
    id: number;
    username: string;
    profile: ProfileModel;
};
