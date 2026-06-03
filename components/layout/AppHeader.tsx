import { AppMobileChrome } from "@/components/layout/app-mobile-chrome";
import {
  getAppHeaderData,
  type AppHeaderData,
} from "@/lib/layout/get-app-header-data";

type AppHeaderProps = {
  data?: AppHeaderData;
};

export async function AppHeader({ data }: AppHeaderProps = {}) {
  const headerData = data ?? (await getAppHeaderData());

  return <AppMobileChrome {...headerData} />;
}
