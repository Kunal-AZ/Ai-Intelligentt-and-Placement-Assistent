from fastapi import Request, HTTPException, status


def get_database(request: Request):
    """Dependency provider for MongoDB database instance."""
    database = getattr(request.app.state, "database", None)
    if database is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database service is unavailable. Please verify MONGODB_URL and database connectivity."
        )
    return database
