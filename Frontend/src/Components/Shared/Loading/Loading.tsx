import "./Loading.css";

// Simple full-page spinner shown while a page is fetching its initial data.
export function Loading() {
    return (
        <div className="Loading">
            <div className="spinner" />
            <p>Loading...</p>
        </div>
    );
}
