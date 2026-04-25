import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { vacationService } from "../../../../Services/VacationService";
import { userService } from "../../../../Services/UserService";
import { notification } from "../../../../Utils/Notification";
import { isAuthError } from "../../../../Utils/Errors";
import { Loading } from "../../../Shared/Loading/Loading";
import "./Reports.css";

// One row in the report: a vacation name and how many likes it has.
type ReportRow = {
    vacation: string;
    likes: number;
};

// Admin-only page. Shows likes per vacation as a bar chart and lets you download the data as CSV.
export function Reports() {
    const navigate = useNavigate();
    const [chartData, setChartData] = useState<ReportRow[]>([]);
    const [loading, setLoading] = useState(true);

    // Load the report when the page first opens (and check the user is logged in).
    useEffect(() => {
        if (!userService.getToken()) {
            navigate("/login");
            return;
        }
        loadReportData();
    }, [navigate]);

    // Get all vacations and the like count for each, then build the chart rows.
    async function loadReportData() {
        setLoading(true);
        try {
            // Ask for up to 100 vacations on a single page so we get the full picture.
            const vacationsResponse = await vacationService.getVacations(1, 100);

            const reportRows: ReportRow[] = await Promise.all(
                vacationsResponse.vacations.map(async (vacation) => {
                    const likes = await vacationService.getLikeCount(vacation._id!);
                    return {
                        vacation: vacation.destination ?? "",
                        likes,
                    };
                })
            );

            setChartData(reportRows);
        } catch (error) {
            console.error("[Reports] failed to load report data:", error);
            notification.error(error);
            // If session is invalid, log out and bounce back to login.
            if (isAuthError(error)) {
                userService.logout();
                navigate("/login");
            }
        } finally {
            setLoading(false);
        }
    }

    // Download the same data as a CSV file the user can open in Excel.
    async function handleDownloadCSV() {
        try {
            // Server returns the CSV as binary data (a Blob).
            const csvBlob = await vacationService.getReportCsv();
            // Build a temporary URL and a hidden link, then "click" it to trigger a download.
            const downloadUrl = window.URL.createObjectURL(csvBlob);
            const downloadLink = document.createElement("a");
            downloadLink.href = downloadUrl;
            downloadLink.setAttribute("download", "vacations_likes_report.csv");
            document.body.appendChild(downloadLink);
            downloadLink.click();
            downloadLink.parentNode?.removeChild(downloadLink);
            notification.success("Report downloaded successfully!");
        } catch (error) {
            console.error("[Reports] CSV download failed:", error);
            notification.error(error);
        }
    }

    if (loading) return <Loading />;

    return (
        <div className="reports-container">
            <div className="reports-header">
                <h1>Vacations Report</h1>
                <button className="download-csv-btn" onClick={handleDownloadCSV}>
                    Download CSV
                </button>
            </div>

            {chartData.length > 0 ? (
                <div className="chart-container">
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="vacation" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="likes" fill="#003580" name="Likes" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <p className="no-data">No data available</p>
            )}

            <table className="report-table">
                <thead>
                    <tr>
                        <th>Destination</th>
                        <th>Likes</th>
                    </tr>
                </thead>
                <tbody>
                    {chartData.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                            <td>{row.vacation}</td>
                            <td>{row.likes}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
