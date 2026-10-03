import { Outlet } from "react-router";
import Header from "./Header";
import ScrollToTopButton from "./ScrollToTopButton";

const Layout = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <Outlet />
      </main>
      <ScrollToTopButton />
    </div>
  );
};

export default Layout;
