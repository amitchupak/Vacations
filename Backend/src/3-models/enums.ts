// HTTP status codes we use when answering requests.
export enum StatusCode {
    OK = 200,
    Created = 201,
    NoContent = 204,
    BadRequest = 400,
    Unauthorized = 401,
    Forbidden = 403,
    NotFound = 404,
    InternalServerError = 500
}

// User roles. Admins can create/edit/delete vacations; Users can only browse and like.
export enum Role {
    User = "User",
    Admin = "Admin"
}
