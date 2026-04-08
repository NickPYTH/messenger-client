import { UserModel } from "entities/user";

export type FavoritesModel = {
    id?: number;
    user: UserModel;
    friend: UserModel;
};
