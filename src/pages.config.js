import BuyCoins from './pages/BuyCoins';
import FindomAnalytics from './pages/FindomAnalytics';
import FindomSession from './pages/FindomSession';
import GoonSession from './pages/GoonSession';
import History from './pages/History';
import Home from './pages/Home';
import Settings from './pages/Settings';
import AICoach from './pages/AICoach';
import __Layout from './Layout.jsx';


export const PAGES = {
    "BuyCoins": BuyCoins,
    "FindomAnalytics": FindomAnalytics,
    "FindomSession": FindomSession,
    "GoonSession": GoonSession,
    "History": History,
    "Home": Home,
    "Settings": Settings,
    "AICoach": AICoach,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};