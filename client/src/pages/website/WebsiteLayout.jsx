import { Outlet, useParams } from "react-router-dom";
import { WebsiteFavoritesProvider } from "../../context/WebsiteFavoritesContext";
import { WebsiteRecentlyViewedProvider } from "../../context/WebsiteRecentlyViewedContext";

export default function WebsiteLayout() {
  const { slug } = useParams();
  return (
    <WebsiteFavoritesProvider slug={slug || ""}>
      <WebsiteRecentlyViewedProvider slug={slug || ""}>
        <Outlet />
      </WebsiteRecentlyViewedProvider>
    </WebsiteFavoritesProvider>
  );
}
