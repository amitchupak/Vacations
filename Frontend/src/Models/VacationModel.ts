// Shape of a vacation package shown on the site.
export class VacationModel {
    public _id?: string;
    public destination?: string;
    public description?: string;
    public startDate?: string;
    public endDate?: string;
    public price?: number;

    // Filename on the server (used to build the image URL).
    public imageName?: string;

    // The actual file the user picked when adding/editing a vacation.
    public image?: File;

    // How many people liked this vacation.
    public likeCount?: number;

    // Whether the current logged-in user has liked it.
    public isLiked?: boolean;
}
