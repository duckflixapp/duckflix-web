import { lazy } from 'react';
import { RouteNode } from '../lib/routes';
import HomePage from '../pages/HomePage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import VerifyEmailPage from '../pages/VerifyEmail';
import NotFoundPage from '../pages/NotFoundPage';
import DetailsResolver from '../pages/details/DetailsPage';
import MovieDetailsPage from '../pages/details/MovieDetailsPage';
import SeriesDetailsPage from '../pages/details/SeriesDetailsPage';
import SeriesSeasonDetailsPage from '../pages/details/SeriesSeasonDetailsPage';
import EpisodeDetailsPage from '../pages/details/EpisodeDetailsPage';
import SearchPage from '../pages/SearchPage';
import LibraryPage from '../pages/LibraryPage';
import BrowsePage from '../pages/BrowsePage';
import { Layout } from '../components/Layout';
import { Navigate } from 'react-router-dom';
import ProfileSelector from '../pages/ProfileSelector';
import MoviesPage from '../pages/Movies';
import ShowsPage from '../pages/Shows';

const AccountLayout = () => <Layout type="account" />;
const AdminLayout = () => <Layout type="admin" />;
const DefaultLayout = () => <Layout type="default" />;

const NavigateToBrowse = () => <Navigate to="/browse" replace />;

export const ROUTES = new RouteNode('root', '/', {
    children: [
        // PUBLIC
        new RouteNode('home', '', {
            element: HomePage,
        }),
        new RouteNode('login', 'login', {
            element: LoginPage,
        }),
        new RouteNode('register', 'register', {
            element: RegisterPage,
        }),
        new RouteNode('verify-email', 'verify-email', {
            element: VerifyEmailPage,
        }),

        // PROTECTED ROOT
        new RouteNode('protected', null, {
            guard: 'protected',
            children: [
                new RouteNode('select-profile', 'select-profile', {
                    element: ProfileSelector,
                }),

                new RouteNode('watch', 'watch/:id', {
                    element: lazy(() => import('../pages/WatchPage')),
                    suspenseLabel: 'Loading player',
                }),

                // MAIN APP LAYOUT
                new RouteNode('app', null, {
                    element: DefaultLayout,
                    children: [
                        new RouteNode('browse', 'browse', {
                            element: BrowsePage,
                        }),
                        new RouteNode('movies', 'movies', {
                            element: MoviesPage,
                        }),
                        new RouteNode('shows', 'shows', {
                            element: ShowsPage,
                        }),
                        new RouteNode('library', 'library', {
                            element: LibraryPage,
                        }),
                        new RouteNode('search', 'search', {
                            element: SearchPage,
                        }),

                        // DETAILS
                        new RouteNode('details', 'details', {
                            children: [
                                new RouteNode('index', ':id', {
                                    element: DetailsResolver,
                                }),
                                new RouteNode('movie', 'movie/:id', {
                                    element: MovieDetailsPage,
                                }),
                                new RouteNode('series', 'series/:id', {
                                    element: SeriesDetailsPage,
                                }),
                                new RouteNode('season', 'season/:id', {
                                    element: SeriesSeasonDetailsPage,
                                }),
                                new RouteNode('episode', 'episode/:id', {
                                    element: EpisodeDetailsPage,
                                }),
                            ],
                        }),

                        // CONTRIBUTOR
                        new RouteNode('contributor', null, {
                            guard: 'contributor',
                            children: [
                                new RouteNode('upload', 'upload', {
                                    element: lazy(() => import('../pages/UploadPage')),
                                    suspenseLabel: 'Loading upload tools',
                                }),
                            ],
                        }),

                        // REDIRECTS
                        new RouteNode('redirect-details', 'details', {
                            element: NavigateToBrowse,
                        }),
                        new RouteNode('redirect-watch', 'watch', {
                            element: NavigateToBrowse,
                        }),
                    ],
                }),

                // ACCOUNT
                new RouteNode('account', 'account', {
                    children: [
                        new RouteNode('account-layout', null, {
                            element: AccountLayout,
                            children: [
                                new RouteNode('index', '', {
                                    element: () => <Navigate to="/account/profile" replace />,
                                }),
                                new RouteNode('profile', 'profile', {
                                    element: lazy(() => import('../pages/account/profile/Profile')),
                                    suspenseLabel: 'Loading account settings',
                                }),
                                new RouteNode('profile-pin', 'profile/pin', {
                                    element: lazy(() => import('../pages/account/profile/ProfilePin')),
                                    suspenseLabel: 'Loading profile PIN settings',
                                }),
                                new RouteNode('profile-pin-change', 'profile/pin/change', {
                                    element: lazy(() => import('../pages/account/profile/ProfilePinChange')),
                                    suspenseLabel: 'Loading profile PIN settings',
                                }),
                                new RouteNode('profile-pin-remove', 'profile/pin/remove', {
                                    element: lazy(() => import('../pages/account/profile/ProfilePinRemove')),
                                    suspenseLabel: 'Loading profile PIN settings',
                                }),
                                new RouteNode('settings', 'settings', {
                                    element: lazy(() => import('../pages/account/settings/Settings')),
                                    suspenseLabel: 'Loading account settings',
                                }),
                                new RouteNode('security', 'security', {
                                    children: [
                                        new RouteNode('index', '', {
                                            element: lazy(() => import('../pages/account/security/Security')),
                                            suspenseLabel: 'Loading account settings',
                                        }),
                                        new RouteNode('twosv', 'twosv', {
                                            element: lazy(() => import('../pages/account/security/TwoStepVerif')),
                                        }),

                                        new RouteNode('devices', 'devices', {
                                            children: [
                                                new RouteNode('index', '', {
                                                    element: lazy(() => import('../pages/account/security/Devices')),
                                                }),
                                                new RouteNode('stepup-protected', null, {
                                                    guard: 'stepup',
                                                    scope: 'sensitive:write',
                                                    children: [
                                                        new RouteNode('device', ':id', {
                                                            element: lazy(() => import('../pages/account/security/Device')),
                                                        }),
                                                    ],
                                                }),
                                            ],
                                        }),

                                        // STEP UP
                                        new RouteNode('stepup-protected', null, {
                                            guard: 'stepup',
                                            scope: 'sensitive:write',
                                            children: [
                                                new RouteNode('password', 'password', {
                                                    element: lazy(() => import('../pages/account/security/Password')),
                                                    suspenseLabel: 'Loading password settings',
                                                }),
                                                new RouteNode('authenticator', 'authenticator', {
                                                    element: lazy(() => import('../pages/account/security/Authenticator')),
                                                    suspenseLabel: 'Loading authenticator',
                                                }),
                                            ],
                                        }),
                                    ],
                                }),
                                new RouteNode('stepup', 'stepup', {
                                    element: lazy(() => import('../pages/account/stepup/StepUp')),
                                }),
                            ],
                        }),
                    ],
                }),

                // ADMIN
                new RouteNode('admin', 'admin', {
                    guard: 'admin',
                    children: [
                        new RouteNode('admin-layout', null, {
                            element: AdminLayout,
                            children: [
                                new RouteNode('index', '', {
                                    element: lazy(() => import('../pages/admin/OverviewPage')),
                                    suspenseLabel: 'Loading admin overview',
                                }),
                                new RouteNode('system', 'system', {
                                    element: lazy(() => import('../pages/admin/SystemPage')),
                                    suspenseLabel: 'Loading system settings',
                                }),
                                new RouteNode('users', 'users', {
                                    element: lazy(() => import('../pages/admin/UsersPage')),
                                    suspenseLabel: 'Loading role manager',
                                }),
                            ],
                        }),
                    ],
                }),
            ],
        }),

        // 404
        new RouteNode('not-found', '*', {
            element: NotFoundPage,
        }),
    ],
});
