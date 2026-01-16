import AICoach from './pages/AICoach';
import Achievements from './pages/Achievements';
import BuyCoins from './pages/BuyCoins';
import FindomAnalytics from './pages/FindomAnalytics';
import FindomSession from './pages/FindomSession';
import GoonSession from './pages/GoonSession';
import GoonerCam from './pages/GoonerCam';
import History from './pages/History';
import Home from './pages/Home';
import KinkSessions from './pages/KinkSessions';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AICoach": AICoach,
    "Achievements": Achievements,
    "BuyCoins": BuyCoins,
    "FindomAnalytics": FindomAnalytics,
    "FindomSession": FindomSession,
    "GoonSession": GoonSession,
    "GoonerCam": GoonerCam,
    "History": History,
    "Home": Home,
    "KinkSessions": KinkSessions,
    "Settings": Settings,
    "Profile": Profile,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};