/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AICoach from './pages/AICoach';
import AIContractDrafter from './pages/AIContractDrafter';
import AIGuidedSession from './pages/AIGuidedSession';
import Achievements from './pages/Achievements';
import AdminFeedback from './pages/AdminFeedback';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import AssetAuction from './pages/AssetAuction';
import BullyChat from './pages/BullyChat';
import BuyCoins from './pages/BuyCoins';
import ContractHistory from './pages/ContractHistory';
import Dashboard from './pages/Dashboard';
import Edge from './pages/Edge';
import Feedback from './pages/Feedback';
import FinancialHealth from './pages/FinancialHealth';
import FindomAI from './pages/FindomAI';
import FindomAnalytics from './pages/FindomAnalytics';
import FindomChallenges from './pages/FindomChallenges';
import FindomDebt from './pages/FindomDebt';
import FindomSession from './pages/FindomSession';
import GeneratedFindomContracts from './pages/GeneratedFindomContracts';
import GoonSession from './pages/GoonSession';
import GoonerCam from './pages/GoonerCam';
import History from './pages/History';
import Home from './pages/Home';
import HornyJail from './pages/HornyJail';
import HouseAuction from './pages/HouseAuction';
import KinkSessions from './pages/KinkSessions';
import MyAssets from './pages/MyAssets';
import MyContracts from './pages/MyContracts';
import MyTasks from './pages/MyTasks';
import NotificationPreferences from './pages/NotificationPreferences';
import Notifications from './pages/Notifications';
import PaymentSettings from './pages/PaymentSettings';
import PremiumFindom from './pages/PremiumFindom';
import Profile from './pages/Profile';
import Reports from './pages/Reports';
import SellAssets from './pages/SellAssets';
import SellHouse from './pages/SellHouse';
import Settings from './pages/Settings';
import Shop from './pages/Shop';
import StreamSetup from './pages/StreamSetup';
import StreamSubscriptions from './pages/StreamSubscriptions';
import WatchStream from './pages/WatchStream';
import ProfileCustomization from './pages/ProfileCustomization';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AICoach": AICoach,
    "AIContractDrafter": AIContractDrafter,
    "AIGuidedSession": AIGuidedSession,
    "Achievements": Achievements,
    "AdminFeedback": AdminFeedback,
    "AnalyticsDashboard": AnalyticsDashboard,
    "AssetAuction": AssetAuction,
    "BullyChat": BullyChat,
    "BuyCoins": BuyCoins,
    "ContractHistory": ContractHistory,
    "Dashboard": Dashboard,
    "Edge": Edge,
    "Feedback": Feedback,
    "FinancialHealth": FinancialHealth,
    "FindomAI": FindomAI,
    "FindomAnalytics": FindomAnalytics,
    "FindomChallenges": FindomChallenges,
    "FindomDebt": FindomDebt,
    "FindomSession": FindomSession,
    "GeneratedFindomContracts": GeneratedFindomContracts,
    "GoonSession": GoonSession,
    "GoonerCam": GoonerCam,
    "History": History,
    "Home": Home,
    "HornyJail": HornyJail,
    "HouseAuction": HouseAuction,
    "KinkSessions": KinkSessions,
    "MyAssets": MyAssets,
    "MyContracts": MyContracts,
    "MyTasks": MyTasks,
    "NotificationPreferences": NotificationPreferences,
    "Notifications": Notifications,
    "PaymentSettings": PaymentSettings,
    "PremiumFindom": PremiumFindom,
    "Profile": Profile,
    "Reports": Reports,
    "SellAssets": SellAssets,
    "SellHouse": SellHouse,
    "Settings": Settings,
    "Shop": Shop,
    "StreamSetup": StreamSetup,
    "StreamSubscriptions": StreamSubscriptions,
    "WatchStream": WatchStream,
    "ProfileCustomization": ProfileCustomization,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};