import FindomSession from './pages/FindomSession';
import GoonSession from './pages/GoonSession';
import History from './pages/History';
import Home from './pages/Home';
import Settings from './pages/Settings';
import BuyCoins from './pages/BuyCoins';
import __Layout from './Layout.jsx';


export const PAGES = {
    "FindomSession": FindomSession,
    "GoonSession": GoonSession,
    "History": History,
    "Home": Home,
    "Settings": Settings,
    "BuyCoins": BuyCoins,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};