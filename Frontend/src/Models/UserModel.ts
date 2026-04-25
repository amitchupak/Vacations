// Shape of a user account we send to and receive from the server.
export class UserModel {
    public _id?: string;
    public userId?: string;
    public firstName?: string;
    public lastName?: string;
    public email?: string;
    public password?: string;

    // "User" can browse and like; "Admin" can also create/edit/delete vacations.
    public role?: "User" | "Admin";
}
