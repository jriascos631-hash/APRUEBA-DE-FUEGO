import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { auth } from '../../firebase/config';
import { signOut } from 'firebase/auth';
import { 
  Flame, 
  Bell, 
  Sun, 
  Moon, 
  ShieldCheck, 
  Search,
  Sparkles,
  ChevronDown,
  Radio,
  BookOpen,
  Music,
  Newspaper,
  Users,
  UserPlus,
  LogOut,
  QrCode,
  Tv
} from 'lucide-react';
import { UserAvatar } from '../common/UserAvatar';
import { InviteFriendsModal } from '../invitations/InviteFriendsModal';
import { AppQRCodeModal } from '../common/AppQRCodeModal';

interface NavbarProps {
  onOpenNotifications: () => void;
  onOpenSearch: () => void;
  onOpenAuthModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenNotifications, onOpenSearch, onOpenAuthModal }) => {
  const { 
    currentUser, 
    registeredUsersCount,
    setActiveTab, 
    notifications,
    isDarkMode,
    setIsDarkMode
  } = useApp();

  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const unreadNotifs = notifications.filter(n => !n.read).length;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('apdf_current_user_id');
      window.location.reload();
    } catch (e) {
      console.warn('Sign out error:', e);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md transition-colors dark:border-slate-800/80 dark:bg-slate-950/90">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-3 sm:px-6">
          
          {/* Zone 1: Brand & Logo */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setActiveTab('inicio')}
              className="flex items-center gap-2 text-left group transition-transform active:scale-95"
            >
              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 shadow-md shadow-orange-500/20">
                <Flame className="h-5 w-5 text-white animate-pulse" />
                <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-950" />
              </div>
              <div>
                <span className="text-base font-extrabold tracking-tight text-white group-hover:text-amber-400 transition-colors font-heading block leading-tight">
                  A PRUEBA DE FUEGO
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-500 block leading-none">
                  Juventud Cristiana & JA
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: Real Users Count + Search */}
          <div className="hidden md:flex items-center gap-3">
            {/* Real Counter Badge (Module 3) */}
            <button
              onClick={() => setActiveTab('descubrir')}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-xs font-semibold text-slate-300 transition-all shadow-sm"
              title="Usuarios registrados en la base de datos de A Prueba de Fuego"
            >
              <Users className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-white font-bold tabular-nums">{registeredUsersCount}</span>
              <span className="text-slate-400 text-[11px]">{registeredUsersCount === 1 ? 'Joven' : 'Jóvenes'}</span>
            </button>

            <button
              onClick={onOpenSearch}
              className="flex items-center gap-2 w-56 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-all"
            >
              <Search className="h-3.5 w-3.5 text-amber-500" />
              <span>Buscar jóvenes, iglesias...</span>
              <kbd className="ml-auto text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">Ctrl+K</kbd>
            </button>
          </div>

          {/* Zone 3: Points Pill, Invite, Notifications, Account */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            
            {/* Real Points Pill */}
            <button
              onClick={() => setActiveTab('ranking')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-red-500/20 border border-amber-500/30 text-amber-300 hover:border-amber-400 transition-all group"
              title="Ver ranking y puntos"
            >
              <Flame className="h-4 w-4 text-orange-400 group-hover:scale-110 transition-transform fill-orange-400" />
              <span className="text-xs font-black tracking-tight tabular-nums text-white">
                {currentUser.points.toLocaleString()}
              </span>
              <span className="text-[10px] font-medium text-amber-400/90 hidden xs:inline">
                pts
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/30 text-amber-200 font-bold uppercase tracking-wider ml-0.5 hidden sm:inline">
                Nv.{currentUser.level}
              </span>
            </button>

            {/* Direct TV Button */}
            <button
              onClick={() => setActiveTab('tv')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-blue-500/30 hover:border-blue-400 text-blue-300 hover:text-white transition-all text-xs font-bold shadow-sm"
              title="Ver Televisión Adventista en Vivo (Hope Channel, 3ABN, Nuevo Tiempo)"
            >
              <Tv className="h-3.5 w-3.5 text-blue-400" />
              <span className="hidden sm:inline">TV en Vivo</span>
            </button>

            {/* Quick QR Mobile Button */}
            <button
              onClick={() => setShowQrModal(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-slate-300 hover:text-amber-400 transition-all text-xs font-bold shadow-sm"
              title="Abrir en celular con código QR"
            >
              <QrCode className="h-3.5 w-3.5 text-amber-400" />
              <span className="hidden sm:inline">Móvil QR</span>
            </button>

            {/* Quick Invite Button */}
            <button
              onClick={() => setShowInviteModal(true)}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 hover:bg-amber-500/25 transition-all text-xs font-bold shadow-sm"
              title="Invitar amigos y cumplir reto misionero (+100 pts)"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Invitar</span>
            </button>

            {/* Search Trigger for Mobile */}
            <button
              onClick={onOpenSearch}
              className="md:hidden flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 hover:bg-slate-800 transition-colors"
              title="Buscar"
            >
              <Search className="h-4 w-4 text-slate-300" />
            </button>

            {/* Admin Panel Quick Access Button */}
            {(currentUser.role === 'superadmin' || currentUser.role === 'admin' || currentUser.email === 'harmonymusis@gmail.com' || currentUser.email === 'harmonyestampadosr@gmail.com') && (
              <button
                onClick={() => setActiveTab('admin')}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs shadow-md shadow-amber-500/25 hover:from-amber-400 hover:to-orange-400 transition-all group"
                title="Ir al Panel de Administración y Supervisión"
              >
                <ShieldCheck className="h-4 w-4 fill-slate-950" />
                <span className="hidden sm:inline">Admin</span>
              </button>
            )}

            {/* Theme Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 hover:bg-slate-800 transition-colors"
              title="Cambiar tema"
            >
              {isDarkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-400" />}
            </button>

            {/* Notifications Bell */}
            <button
              onClick={onOpenNotifications}
              className="relative flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 hover:bg-slate-800 transition-colors"
              title="Notificaciones"
            >
              <Bell className="h-4 w-4" />
              {unreadNotifs > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white ring-2 ring-slate-950">
                  {unreadNotifs}
                </span>
              )}
            </button>

            {/* Account Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowAccountMenu(!showAccountMenu)}
                className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-slate-800/80 transition-colors border border-transparent hover:border-slate-700"
              >
                <UserAvatar
                  avatar={currentUser.avatar}
                  name={currentUser.name}
                  size="xs"
                  isOfficial={currentUser.role === 'admin' || currentUser.isOfficialVerified}
                  showBadge={false}
                />
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </button>

              {showAccountMenu && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 border-b border-slate-800/80 mb-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-white truncate">{currentUser.name} {currentUser.lastName}</p>
                      {currentUser.isOfficialVerified && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          OFICIAL
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">@{currentUser.username}</p>
                    <p className="text-[10px] text-amber-400 font-semibold mt-1">
                      Nivel {currentUser.level} — {currentUser.levelName} ({currentUser.points} pts)
                    </p>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setShowAccountMenu(false);
                        onOpenAuthModal();
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 font-bold flex items-center justify-between mb-1"
                    >
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck className="h-4 w-4" />
                        <span>Acceder / Registrar con Google</span>
                      </span>
                      <span className="text-[10px] text-amber-300">Auth</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowAccountMenu(false);
                        setShowInviteModal(true);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs text-emerald-300 hover:bg-emerald-500/10 flex items-center justify-between font-semibold"
                    >
                      <span className="flex items-center gap-1.5">
                        <UserPlus className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Invitar a un amigo</span>
                      </span>
                      <span className="text-[10px] text-emerald-400 font-bold">+100 pts</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('comunidad_juvenil');
                        setShowAccountMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs text-amber-300 hover:bg-amber-500/10 flex items-center justify-between font-bold"
                    >
                      <span className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-amber-400" />
                        <span>Comunidad Juvenil Cristiana</span>
                      </span>
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-bold">Nuevo</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('perfil');
                        setShowAccountMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs text-slate-200 hover:bg-slate-800 hover:text-white flex items-center justify-between"
                    >
                      <span>Ver mi ficha de jugador</span>
                      <span className="text-[10px] text-amber-400">Perfil</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('juegos');
                        setShowAccountMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs text-amber-300 hover:bg-amber-500/10 flex items-center justify-between"
                    >
                      <span>🎮 Juegos Bíblicos & Trivia</span>
                      <span className="text-[10px] text-amber-400">Puntos</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('en_vivo');
                        setShowAccountMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs text-red-300 hover:bg-red-500/10 flex items-center justify-between"
                    >
                      <span className="flex items-center gap-1.5">
                        <Radio className="w-3.5 h-3.5 text-red-400" />
                        <span>Radio Adventista (AWR/Esperanza)</span>
                      </span>
                      <span className="text-[10px] text-red-400 font-bold">Radio</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('tv');
                        setShowAccountMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs text-blue-300 hover:bg-blue-500/10 flex items-center justify-between"
                    >
                      <span className="flex items-center gap-1.5">
                        <Tv className="w-3.5 h-3.5 text-blue-400" />
                        <span>Televisión en Vivo (Hope/3ABN)</span>
                      </span>
                      <span className="text-[10px] text-blue-400 font-bold">TV IASD</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowAccountMenu(false);
                        setShowQrModal(true);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs text-amber-300 hover:bg-amber-500/10 flex items-center justify-between"
                    >
                      <span className="flex items-center gap-1.5">
                        <QrCode className="w-3.5 h-3.5 text-amber-400" />
                        <span>Abrir en mi Celular (Código QR)</span>
                      </span>
                      <span className="text-[10px] text-amber-400 font-bold">Móvil</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('noticias');
                        setShowAccountMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs text-emerald-300 hover:bg-emerald-500/10 flex items-center justify-between"
                    >
                      <span className="flex items-center gap-1.5">
                        <Newspaper className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Noticias Adventistas</span>
                      </span>
                      <span className="text-[10px] text-emerald-400 font-bold">Oficial</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('himnario');
                        setShowAccountMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs text-amber-300 hover:bg-amber-500/10 flex items-center justify-between"
                    >
                      <span className="flex items-center gap-1.5">
                        <Music className="w-3.5 h-3.5 text-amber-400" />
                        <span>Himnario Adventista</span>
                      </span>
                      <span className="text-[10px] text-amber-400 font-bold">613 Himnos</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('libros');
                        setShowAccountMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs text-indigo-300 hover:bg-indigo-500/10 flex items-center justify-between"
                    >
                      <span className="flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Libros & Elena G. White</span>
                      </span>
                      <span className="text-[10px] text-indigo-400 font-bold">Lector</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('actividades');
                        setShowAccountMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs text-amber-300 hover:bg-amber-500/10 flex items-center justify-between"
                    >
                      <span>💡 Ideas JA & Fondos</span>
                      <span className="text-[10px] text-amber-400">Guías</span>
                    </button>

                    {(currentUser.role === 'superadmin' || currentUser.role === 'admin' || currentUser.email === 'harmonymusis@gmail.com') && (
                      <button
                        onClick={() => {
                          setActiveTab('admin');
                          setShowAccountMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs text-amber-400 hover:bg-amber-500/10 flex items-center gap-2 font-semibold"
                      >
                        <ShieldCheck className="h-4 w-4" />
                        <span>Panel Administrativo</span>
                      </button>
                    )}
                  </div>

                  {/* Clean User Session Actions */}
                  <div className="border-t border-slate-800/80 pt-2 mt-1 space-y-1">
                    <button
                      onClick={() => {
                        setActiveTab('onboarding');
                        setShowAccountMenu(false);
                      }}
                      className="w-full text-center px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                      <span>Crear nuevo perfil (00 pts)</span>
                    </button>

                    {auth.currentUser && (
                      <button
                        onClick={handleLogout}
                        className="w-full text-center px-3 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/50 text-red-300 text-xs font-semibold flex items-center justify-center gap-1.5 border border-red-900/30"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        <span>Cerrar Sesión</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      </header>

      {/* Invite Friends Modal */}
      <InviteFriendsModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
      />

      {/* App Mobile QR Modal */}
      <AppQRCodeModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
      />
    </>
  );
};
