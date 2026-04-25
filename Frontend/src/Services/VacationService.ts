import axios from "axios";
import { VacationModel } from "../Models/VacationModel";
import { appConfig } from "../Utils/AppConfig";

// Shape of the paginated list the server returns.
type PaginatedVacations = {
    vacations: VacationModel[];
    total: number;
    pages: number;
};

// Filter buttons on the vacations page map to these values.
type FilterType = "all" | "liked" | "active" | "upcoming";

// Handles all vacation-related API calls (list, create, edit, delete, like).
class VacationService {

    // Last list we got from the server, kept so other pages can find a vacation
    // by id without a fresh request.
    private cachedVacations: VacationModel[] = [];

    // Get one page of vacations (defaults: page 1, 9 per page).
    public async getVacations(page: number = 1, limit: number = 9): Promise<PaginatedVacations> {
        const response = (await axios.get<PaginatedVacations>(
            `${appConfig.vacationsUrl}?page=${page}&limit=${limit}`
        )).data;

        this.cachedVacations = response.vacations;
        return response;
    }

    // Get vacations filtered by category (liked / active / upcoming / all).
    public async getFilteredVacations(filter: FilterType, page: number = 1, limit: number = 9): Promise<PaginatedVacations> {
        const response = (await axios.get<PaginatedVacations>(
            `${appConfig.vacationsFilterUrl}${filter}?page=${page}&limit=${limit}`
        )).data;

        this.cachedVacations = response.vacations;
        return response;
    }

    // Get one vacation by id. Use the cached copy first to save a request.
    public async getVacationById(id: string): Promise<VacationModel> {
        const cached = this.cachedVacations.find(vacation => vacation._id === id);
        if (cached) return cached;

        return (await axios.get<VacationModel>(appConfig.vacationsUrl + id)).data;
    }

    // Send a new vacation to the server (admin only).
    public async addVacation(vacation: VacationModel): Promise<VacationModel> {
        const formData = this.toFormData(vacation);
        const added = (await axios.post<VacationModel>(appConfig.vacationsUrl, formData)).data;
        this.cachedVacations.push(added);
        return added;
    }

    // Update an existing vacation (admin only).
    public async updateVacation(id: string, vacation: VacationModel): Promise<VacationModel> {
        const formData = this.toFormData(vacation);
        const updated = (await axios.put<VacationModel>(appConfig.vacationsUrl + id, formData)).data;
        this.cachedVacations = this.cachedVacations.map(existing => existing._id === id ? updated : existing);
        return updated;
    }

    // Remove a vacation (admin only).
    public async deleteVacation(id: string): Promise<void> {
        await axios.delete(appConfig.vacationsUrl + id);
        this.cachedVacations = this.cachedVacations.filter(vacation => vacation._id !== id);
    }

    // Tell the server "I like this vacation".
    public async likeVacation(vacationId: string): Promise<void> {
        await axios.post(appConfig.likesUrl + vacationId, {});
    }

    // Tell the server "I no longer like this vacation".
    public async unlikeVacation(vacationId: string): Promise<void> {
        await axios.delete(appConfig.likesUrl + vacationId);
    }

    // Get the total number of likes a vacation has.
    public async getLikeCount(vacationId: string): Promise<number> {
        const response = (await axios.get<{ count: number }>(appConfig.likeCountUrl + vacationId)).data;
        return response.count;
    }

    // Check if the current user already liked this vacation.
    public async isVacationLiked(vacationId: string): Promise<boolean> {
        const response = (await axios.get<{ isLiked: boolean }>(appConfig.likeCheckUrl + vacationId)).data;
        return response.isLiked;
    }

    // Download the admin "likes per vacation" CSV report as a Blob.
    public async getReportCsv(): Promise<Blob> {
        const response = await axios.get(appConfig.reportsCsvUrl, { responseType: "blob" });
        return response.data;
    }

    // Convert a VacationModel into FormData so we can send the image file with it.
    private toFormData(vacation: VacationModel): FormData {
        const formData = new FormData();
        (Object.entries(vacation) as [string, unknown][]).forEach(([key, value]) => {
            if (value === undefined || value === null) return;
            // Skip fields the server calculates itself.
            if (key === "likeCount" || key === "isLiked" || key === "_id") return;
            formData.append(
                key,
                value instanceof File ? value : value.toString()
            );
        });
        return formData;
    }
}

// One shared instance for the whole app.
export const vacationService = new VacationService();
