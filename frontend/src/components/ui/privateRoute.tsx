import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"

export default function PrivateRoute() {
    const { currentUser } = useAuth()
    const location = useLocation()

    // If not authenticated, redirect to login page while saving the attempted location
    if (!currentUser) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    // If authenticated, render the child routes
    return <Outlet />
}

