import Home from './pages/Home';
import GoonSession from './pages/GoonSession';
import FindomSession from './pages/FindomSession';
import Settings from './pages/Settings';
import History from './pages/History';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "GoonSession": GoonSession,
    "FindomSession": FindomSession,
    "Settings": Settings,
    "History": History,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};