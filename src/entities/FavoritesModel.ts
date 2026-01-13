import { UserModel } from './UserModel';

export type FavoritesModel = {
    id?: number;
    user: UserModel;
    friend: UserModel;
};
