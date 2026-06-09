import { Link } from "react-router";
import { PlusIcon, LogOutIcon } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-base-300 border-b border-base-content/10">
      <div className="mx-auto max-w-6xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/notely_forest_icon.svg" alt="Notely Forest Icon" className="w-8 h-8" />
            <h1 className="text-3xl font-bold text-primary font-mono tracking-tighter">
              Notely
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <>
                <div className="flex items-center gap-2">
                  {user.avatar && (
                    <img
                      src={user.avatar}
                      alt={user.displayName}
                      className="w-8 h-8 rounded-full ring-2 ring-primary/30"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <span className="text-sm text-base-content/70 hidden sm:inline">
                    {user.displayName}
                  </span>
                </div>
                <Link to={"/create"} className="btn btn-primary btn-sm sm:btn-md">
                  <PlusIcon className="size-5" />
                  <span className="hidden sm:inline">New Note</span>
                </Link>
                <button
                  onClick={logout}
                  className="btn btn-ghost btn-sm sm:btn-md tooltip tooltip-bottom"
                  data-tip="Logout"
                >
                  <LogOutIcon className="size-5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
