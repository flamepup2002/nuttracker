import BuyCoins from './pages/BuyCoins';
import FindomAnalytics from './pages/FindomAnalytics';
import History from './pages/History';
import Home from './pages/Home';
import AICoach from './pages/AICoach';
import Achievements from './pages/Achievements';
import KinkSessions from './pages/KinkSessions';
import FindomSession from './pages/FindomSession';
import GoonSession from './pages/GoonSession';
import GoonerCam from './pages/GoonerCam';
import Settings from './pages/Settings';
import __Layout from './Layout.jsx';


export const PAGES = {
    "BuyCoins": BuyCoins,
    "FindomAnalytics": FindomAnalytics,
    "History": History,
    "Home": Home,
    "AICoach": AICoach,
    "Achievements": Achievements,
    "KinkSessions": KinkSessions,
    "FindomSession": FindomSession,
    "GoonSession": GoonSession,
    "GoonerCam": GoonerCam,
    "Settings": Settings,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};