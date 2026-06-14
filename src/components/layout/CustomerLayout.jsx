import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import BottomNav from "./BottomNav";
import WhatsAppButton from "./WhatsAppButton";
import AnnouncementBar from "./AnnouncementBar";

function CustomerLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <AnnouncementBar />
      <Navbar />
      <main className="flex-grow pt-2.5">
        <Outlet />
      </main>
      <Footer />
      <BottomNav />
      <WhatsAppButton />
    </div>
  );
}