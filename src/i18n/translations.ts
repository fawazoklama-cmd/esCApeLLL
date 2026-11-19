import type { AreaId, CharacterId, Language } from '../types/game';

export interface Translations {
  brand: string;
  tagline: string;
  worldName: string;
  nav: {
    home: string;
    play: string;
    characters: string;
    modes: string;
    leaderboard: string;
    profile: string;
    settings: string;
    howToPlay: string;
    back: string;
  };
  theme: {
    day: string;
    night: string;
    toggleLabel: string;
  };
  home: {
    playNow: string;
    chooseMode: string;
    selectRunner: string;
    howToPlay: string;
    leaderboard: string;
    settings: string;
    profile: string;
    activeRunner: string;
    controlsHint: string;
    bestRun: string;
  };
  characters: {
    title: string;
    subtitle: string;
    selectBtn: string;
    selectedBadge: string;
    previewAnim: string;
    animations: {
      idle: string;
      run: string;
      jump: string;
      slide: string;
      dodge_left: string;
      victory: string;
      defeat: string;
    };
    list: Record<
      CharacterId,
      {
        name: string;
        role: string;
        bio: string;
        style: string;
        specialty: string;
      }
    >;
  };
  modes: {
    title: string;
    subtitle: string;
    endlessTitle: string;
    endlessDesc: string;
    endlessStart: string;
    duelTitle: string;
    duelDesc: string;
    duelStart: string;
    worldAreas: string;
  };
  areas: Record<AreaId, { name: string; desc: string }>;
  lobby: {
    title: string;
    subtitle: string;
    signInRequired: string;
    signInAction: string;
    matchmakingBtn: string;
    searching: string;
    noPublicRooms: string;
    createPublic: string;
    createPrivate: string;
    joinByCode: string;
    roomCodePlaceholder: string;
    joinBtn: string;
    roomCodeLabel: string;
    copyCode: string;
    copied: string;
    waitingOpponent: string;
    opponentJoined: string;
    readyBtn: string;
    unreadyBtn: string;
    readyState: string;
    notReadyState: string;
    startCountdown: string;
    leaveRoom: string;
    targetDistance: string;
    connectionOnline: string;
    connectionOffline: string;
    reconnectNotice: string;
    roomNotFound: string;
    roomFull: string;
    cantJoinOwn: string;
    publicRoomsTitle: string;
    noOpenRooms: string;
    joinThisRoom: string;
  };
  hud: {
    distance: string;
    score: string;
    coins: string;
    speed: string;
    multiplier: string;
    area: string;
    opponent: string;
    you: string;
    alive: string;
    eliminated: string;
    disconnected: string;
    countdownGo: string;
    pause: string;
    mute: string;
    unmute: string;
    left: string;
    right: string;
    jump: string;
    slide: string;
  };
  modals: {
    pausedTitle: string;
    resume: string;
    restart: string;
    exitHome: string;
    gameOverTitle: string;
    victoryTitle: string;
    defeatTitle: string;
    drawTitle: string;
    reviveBtn: string;
    reviveCost: string;
    notEnoughCoins: string;
    playAgain: string;
    backToLobby: string;
    newBest: string;
    validatedScore: string;
    finalScore: string;
    distanceReached: string;
    coinsEarned: string;
    opponentProgress: string;
    howToPlayTitle: string;
    pcControls: string;
    mobileControls: string;
    pcRules: string[];
    mobileRules: string[];
    close: string;
  };
  leaderboard: {
    title: string;
    subtitle: string;
    global: string;
    daily: string;
    weekly: string;
    rank: string;
    player: string;
    character: string;
    score: string;
    distance: string;
    loading: string;
    empty: string;
    error: string;
    verified: string;
  };
  profile: {
    title: string;
    signInTitle: string;
    signInDesc: string;
    googleLogin: string;
    emailTab: string;
    registerTab: string;
    emailLabel: string;
    passwordLabel: string;
    usernameLabel: string;
    loginBtn: string;
    registerBtn: string;
    guestBtn: string;
    guestBadge: string;
    logoutBtn: string;
    saveProfile: string;
    saved: string;
    avatarLabel: string;
    statsTitle: string;
    highScore: string;
    bestDistance: string;
    totalCoins: string;
    totalGames: string;
    wins: string;
    losses: string;
    totalDistance: string;
    historyTitle: string;
    noHistory: string;
    providerDisabledHint: string;
  };
  settings: {
    title: string;
    language: string;
    theme: string;
    sound: string;
    music: string;
    on: string;
    off: string;
    graphics: string;
    graphicsLow: string;
    graphicsMedium: string;
    graphicsHigh: string;
    controls: string;
    controlsSummary: string;
    creditsTitle: string;
  };
  credits: {
    title: string;
    createdBy: string;
    ideaBy: string;
  };
  notifications: {
    roomCreated: string;
    scoreSaved: string;
    scoreRejected: string;
    revived: string;
    errorGeneric: string;
  };
}

export const TRANSLATIONS: Record<Language, Translations> = {
  id: {
    brand: 'esCApeLL',
    tagline: 'RUN BEYOND THE END.',
    worldName: 'THE LAST HORIZON',
    nav: {
      home: 'Beranda',
      play: 'Main',
      characters: 'Karakter',
      modes: 'Mode',
      leaderboard: 'Peringkat',
      profile: 'Profil',
      settings: 'Pengaturan',
      howToPlay: 'Cara Bermain',
      back: 'Kembali',
    },
    theme: {
      day: 'Siang',
      night: 'Malam',
      toggleLabel: 'Ubah Tema Siang / Malam',
    },
    home: {
      playNow: 'Mulai Berlari',
      chooseMode: 'Mode Permainan',
      selectRunner: 'Pilih Karakter',
      howToPlay: 'Cara Bermain',
      leaderboard: 'Leaderboard',
      settings: 'Pengaturan',
      profile: 'Profil & Akun',
      activeRunner: 'Survivor Aktif',
      controlsHint: 'A / D Geser Jalur · W / Spasi Lompat · S Sliding · Esc Jeda',
      bestRun: 'Rekor Terbaik',
    },
    characters: {
      title: 'Pilih Survivor Utama',
      subtitle: 'Model 3D penuh dengan 7 animasi unik untuk melintasi The Last Horizon.',
      selectBtn: 'Pilih Karakter',
      selectedBadge: 'Terpilih',
      previewAnim: 'Pratinjau Animasi',
      animations: {
        idle: 'Diam',
        run: 'Lari',
        jump: 'Lompat',
        slide: 'Sliding',
        dodge_left: 'Menghindar',
        victory: 'Menang',
        defeat: 'Kalah',
      },
      list: {
        camelia: {
          name: 'Camelia Guele',
          role: 'Penjelajah Horizon',
          bio: 'Survivor perempuan tangguh dengan rambut panjang sedikit berantakan, bekas luka di pipi, jaket robek bernuansa pink-putih-biru, sarung tangan tempur, dan sepatu boots.',
          style: 'Pink Lembut · Putih · Biru Langit',
          specialty: 'Kelincahan Tinggi & Respons Cepat',
        },
        elio: {
          name: 'Elio Calya',
          role: 'Pelari Garis Depan',
          bio: 'Survivor laki-laki bertekad baja dengan rambut berantakan, ekspresi serius, bekas luka khas, jaket taktis gelap bertali biru-putih, perlengkapan pasca-perang, sarung tangan, dan boots.',
          style: 'Biru Langit · Hitam Taktis · Putih',
          specialty: 'Keseimbangan Lari & Pemulihan Stabil',
        },
      },
    },
    modes: {
      title: 'Pilih Mode Permainan',
      subtitle: 'Tantang dirimu menembus reruntuhan atau duel langsung secara online.',
      endlessTitle: 'Endless Escape',
      endlessDesc:
        'Lari tanpa akhir melintasi 5 zona The Last Horizon. Kecepatan terus meningkat seiring jarak, kumpulkan koin energi, dan raih skor tertinggi.',
      endlessStart: 'Main Endless Escape',
      duelTitle: 'Online Duel',
      duelDesc:
        'Pertandingan 2 pemain secara real-time! Buat room privat/publik atau ikut matchmaking, balapan di lintasan identik, dan buktikan siapa yang bertahan paling jauh.',
      duelStart: 'Masuk Lobi Duel',
      worldAreas: 'Zona Dunia: The Last Horizon',
    },
    areas: {
      skyline_ruins: {
        name: 'SKYLINE RUINS',
        desc: 'Kota futuristik terbengkalai dengan menara retak dan hologram berkedip.',
      },
      pink_valley: {
        name: 'PINK VALLEY',
        desc: 'Lembah tebing menjulang yang dipenuhi pepohonan pink pasca-perang.',
      },
      broken_bridge: {
        name: 'BROKEN BRIDGE',
        desc: 'Jembatan langit panjang dengan celah runtuhan dan kabel baja terputus.',
      },
      cloud_district: {
        name: 'CLOUD DISTRICT',
        desc: 'Distrik menara tinggi di atas hamparan awan biru dan cahaya cakrawala.',
      },
      abandoned_station: {
        name: 'ABANDONED STATION',
        desc: 'Stasiun transit futuristik terbengkalai dengan gerbang laser dan puing.',
      },
    },
    lobby: {
      title: 'Lobi Online Duel',
      subtitle: 'Sinkronisasi real-time untuk dua pemain asli — tanpa bot.',
      signInRequired: 'Masuk terlebih dahulu (Google, Email, atau Guest) untuk bermain Online Duel.',
      signInAction: 'Buka Profil & Login',
      matchmakingBtn: 'Cari Lawan Publik (Matchmaking)',
      searching: 'Mencari room publik terbuka...',
      noPublicRooms: 'Belum ada room publik tersedia. Buat room baru dan tunggu pemain lain bergabung.',
      createPublic: 'Buat Room Publik',
      createPrivate: 'Buat Room Privat',
      joinByCode: 'Gabung Dengan Kode Room',
      roomCodePlaceholder: 'KODE 6 HURUF',
      joinBtn: 'Gabung',
      roomCodeLabel: 'Kode Room',
      copyCode: 'Salin Kode',
      copied: 'Tersalin!',
      waitingOpponent: 'Menunggu pemain lain bergabung...',
      opponentJoined: 'Lawan terhubung! Tekan Siap untuk memulai hitungan mundur.',
      readyBtn: 'Saya Siap',
      unreadyBtn: 'Batalkan Siap',
      readyState: 'Siap',
      notReadyState: 'Belum Siap',
      startCountdown: 'Pertandingan dimulai dalam',
      leaveRoom: 'Keluar Room',
      targetDistance: 'Target Jarak Duel',
      connectionOnline: 'Terhubung',
      connectionOffline: 'Koneksi Terputus — Menyambungkan ulang...',
      reconnectNotice: 'Sesi duel aktif ditemukan. Menyambungkan kembali ke room...',
      roomNotFound: 'Room dengan kode tersebut tidak ditemukan.',
      roomFull: 'Room sudah penuh atau pertandingan telah dimulai.',
      cantJoinOwn: 'Anda tidak dapat bergabung ke room Anda sendiri sebagai lawan.',
      publicRoomsTitle: 'Daftar Room Publik Terbuka',
      noOpenRooms: 'Belum ada pemain lain yang membuka room publik saat ini.',
      joinThisRoom: 'Gabung Room',
    },
    hud: {
      distance: 'Jarak',
      score: 'Skor',
      coins: 'Koin',
      speed: 'Kecepatan',
      multiplier: 'Pengali',
      area: 'Zona',
      opponent: 'Lawan',
      you: 'Anda',
      alive: 'Berlari',
      eliminated: 'Tumbang',
      disconnected: 'Terputus',
      countdownGo: 'LARI!',
      pause: 'Jeda',
      mute: 'Bisukan Audio',
      unmute: 'Aktifkan Audio',
      left: 'Kiri',
      right: 'Kanan',
      jump: 'Lompat',
      slide: 'Sliding',
    },
    modals: {
      pausedTitle: 'Permainan Dijeda',
      resume: 'Lanjutkan',
      restart: 'Mulai Ulang',
      exitHome: 'Kembali ke Beranda',
      gameOverTitle: 'Perjalanan Terhenti',
      victoryTitle: 'Kemenangan Duel!',
      defeatTitle: 'Duel Berakhir',
      drawTitle: 'Pertandingan Seri',
      reviveBtn: 'Bangkit Kembali',
      reviveCost: 'Gunakan 25 Koin',
      notEnoughCoins: 'Koin belum cukup (butuh 25)',
      playAgain: 'Main Lagi',
      backToLobby: 'Kembali ke Lobi',
      newBest: 'Rekor Baru!',
      validatedScore: 'Skor Terverifikasi Server',
      finalScore: 'Skor Akhir',
      distanceReached: 'Jarak Tempuh',
      coinsEarned: 'Koin Didapat',
      opponentProgress: 'Jarak Lawan',
      howToPlayTitle: 'Cara Bermain esCApeLL',
      pcControls: 'Kontrol PC / Keyboard',
      mobileControls: 'Kontrol Mobile / Layar Sentuh',
      pcRules: [
        'A atau Panah Kiri: Pindah ke jalur kiri',
        'D atau Panah Kanan: Pindah ke jalur kanan',
        'W, Panah Atas, atau Spasi: Lompati mobil rusak, barrier, dan jembatan putus',
        'S atau Panah Bawah: Sliding di bawah gerbang laser dan puing melayang',
        'Esc: Jeda permainan kapan saja',
      ],
      mobileRules: [
        'Geser (Swipe) Kiri / Kanan: Pindah jalur dengan cepat',
        'Geser Atas: Lompat melewati rintangan rendah',
        'Geser Bawah: Sliding melewati rintangan atas',
        'Tombol sentuh alternatif tersedia di sudut bawah layar saat bermain',
      ],
      close: 'Tutup',
    },
    leaderboard: {
      title: 'Leaderboard Dunia',
      subtitle: 'Peringkat langsung dari Cloud Firestore — skor tervalidasi server.',
      global: 'Global',
      daily: 'Harian',
      weekly: 'Mingguan',
      rank: 'Peringkat',
      player: 'Pemain',
      character: 'Karakter',
      score: 'Skor',
      distance: 'Jarak',
      loading: 'Memuat peringkat online...',
      empty: 'Belum ada skor tercatat untuk periode ini. Jadilah yang pertama mencetak rekor!',
      error: 'Gagal memuat leaderboard. Periksa koneksi internet Anda.',
      verified: 'Tervalidasi',
    },
    profile: {
      title: 'Profil Survivor',
      signInTitle: 'Masuk ke Akun esCApeLL',
      signInDesc: 'Simpan skor tertinggi, progres koin, riwayat duel, dan pengaturan di cloud.',
      googleLogin: 'Masuk dengan Google',
      emailTab: 'Masuk Email',
      registerTab: 'Daftar Email',
      emailLabel: 'Alamat Email',
      passwordLabel: 'Kata Sandi (min. 6 karakter)',
      usernameLabel: 'Nama Survivor',
      loginBtn: 'Masuk',
      registerBtn: 'Buat Akun',
      guestBtn: 'Masuk Mode Guest',
      guestBadge: 'Akun Guest',
      logoutBtn: 'Keluar',
      saveProfile: 'Simpan Profil',
      saved: 'Tersimpan!',
      avatarLabel: 'Pilih Avatar',
      statsTitle: 'Statistik Perjalanan',
      highScore: 'Skor Tertinggi',
      bestDistance: 'Jarak Terbaik',
      totalCoins: 'Total Koin',
      totalGames: 'Total Main',
      wins: 'Menang Duel',
      losses: 'Kalah Duel',
      totalDistance: 'Total Jarak',
      historyTitle: 'Riwayat Pertandingan Terakhir',
      noHistory: 'Belum ada riwayat pertandingan tercatat.',
      providerDisabledHint:
        'Provider login ini belum diaktifkan di Firebase Console Anda. Gunakan Google Login atau aktifkan Email/Password & Anonymous di Firebase Authentication -> Sign-in method.',
    },
    settings: {
      title: 'Pengaturan Game',
      language: 'Bahasa Antarmuka',
      theme: 'Tema Dunia & Web',
      sound: 'Efek Suara (SFX)',
      music: 'Musik Latar',
      on: 'Aktif',
      off: 'Nonaktif',
      graphics: 'Kualitas Grafis 3D',
      graphicsLow: 'Low',
      graphicsMedium: 'Medium',
      graphicsHigh: 'High',
      controls: 'Ringkasan Kontrol',
      controlsSummary: 'PC: A/D/W/S, Panah, Spasi, Esc · Mobile: Swipe & Tombol Sentuh',
      creditsTitle: 'Kredit Pengembang',
    },
    credits: {
      title: 'esCApeLL',
      createdBy: 'CREATED BY',
      ideaBy: 'IDEA BY',
    },
    notifications: {
      roomCreated: 'Room duel berhasil dibuat!',
      scoreSaved: 'Skor terverifikasi & tersimpan ke leaderboard.',
      scoreRejected: 'Skor gagal verifikasi server.',
      revived: 'Bangkit kembali! Terus berlari!',
      errorGeneric: 'Terjadi gangguan jaringan. Silakan coba lagi.',
    },
  },
  en: {
    brand: 'esCApeLL',
    tagline: 'RUN BEYOND THE END.',
    worldName: 'THE LAST HORIZON',
    nav: {
      home: 'Home',
      play: 'Play',
      characters: 'Characters',
      modes: 'Modes',
      leaderboard: 'Leaderboard',
      profile: 'Profile',
      settings: 'Settings',
      howToPlay: 'How to Play',
      back: 'Back',
    },
    theme: {
      day: 'Day Mode',
      night: 'Night Mode',
      toggleLabel: 'Toggle Day / Night Mode',
    },
    home: {
      playNow: 'Play Now',
      chooseMode: 'Game Modes',
      selectRunner: 'Select Runner',
      howToPlay: 'How to Play',
      leaderboard: 'Leaderboard',
      settings: 'Settings',
      profile: 'Profile & Auth',
      activeRunner: 'Active Survivor',
      controlsHint: 'A / D Switch Lane · W / Space Jump · S Slide · Esc Pause',
      bestRun: 'Personal Best',
    },
    characters: {
      title: 'Choose Your Survivor',
      subtitle: 'Full 3D articulated models with 7 custom animations across The Last Horizon.',
      selectBtn: 'Select Character',
      selectedBadge: 'Selected',
      previewAnim: 'Animation Preview',
      animations: {
        idle: 'Idle',
        run: 'Run',
        jump: 'Jump',
        slide: 'Slide',
        dodge_left: 'Dodge',
        victory: 'Victory',
        defeat: 'Defeat',
      },
      list: {
        camelia: {
          name: 'Camelia Guele',
          role: 'Horizon Pathfinder',
          bio: 'Resilient female survivor with messy long hair, stylized facial scar, weathered pink-white-blue torn adventurer jacket, fingerless gloves, and combat boots.',
          style: 'Soft Pink · Crisp White · Sky Blue',
          specialty: 'High Agility & Rapid Lane Cut',
        },
        elio: {
          name: 'Elio Calya',
          role: 'Vanguard Runner',
          bio: 'Stoic male survivor with tousled hair, serious expression, stylized scar, dark tactical post-war jacket with sky-blue trim, survivor gear, gloves, and boots.',
          style: 'Sky Blue · Tactical Black · White',
          specialty: 'Balanced Momentum & Steady Stride',
        },
      },
    },
    modes: {
      title: 'Select Game Mode',
      subtitle: 'Push your limits solo or face a live opponent in Online Duel.',
      endlessTitle: 'Endless Escape',
      endlessDesc:
        'Sprint endlessly across 5 dynamic zones of The Last Horizon. Speed scales continuously with distance while you dodge hazards and gather energy coins.',
      endlessStart: 'Launch Endless Escape',
      duelTitle: 'Online Duel',
      duelDesc:
        'Real-time 2-player competitive run! Create a public or private room, share the Room Code, race on an identical seeded track, and outlast your rival.',
      duelStart: 'Enter Duel Lobby',
      worldAreas: 'World Zones: The Last Horizon',
    },
    areas: {
      skyline_ruins: {
        name: 'SKYLINE RUINS',
        desc: 'Abandoned futuristic metropolis with shattered towers and flickering holograms.',
      },
      pink_valley: {
        name: 'PINK VALLEY',
        desc: 'High-cliff canyon valley overgrown with resilient pink-blossom survivor trees.',
      },
      broken_bridge: {
        name: 'BROKEN BRIDGE',
        desc: 'Suspended skyway span with collapsed deck gaps and snapped suspension cables.',
      },
      cloud_district: {
        name: 'CLOUD DISTRICT',
        desc: 'Elevated high-altitude towers rising through luminous sky-blue cloud banks.',
      },
      abandoned_station: {
        name: 'ABANDONED STATION',
        desc: 'Derelict futuristic transit terminal guarded by active laser gates and debris.',
      },
    },
    lobby: {
      title: 'Online Duel Lobby',
      subtitle: 'Real-time synchronization for two real players — zero fake bots.',
      signInRequired: 'Sign in (Google, Email, or Guest Mode) to create or join an Online Duel.',
      signInAction: 'Open Profile & Sign In',
      matchmakingBtn: 'Find Public Match (Matchmaking)',
      searching: 'Searching open public rooms...',
      noPublicRooms: 'No open public rooms found yet. Create one and wait for a challenger.',
      createPublic: 'Create Public Room',
      createPrivate: 'Create Private Room',
      joinByCode: 'Join with Room Code',
      roomCodePlaceholder: '6-CHAR CODE',
      joinBtn: 'Join',
      roomCodeLabel: 'Room Code',
      copyCode: 'Copy Code',
      copied: 'Copied!',
      waitingOpponent: 'Waiting for opponent to join...',
      opponentJoined: 'Opponent connected! Ready up to start the countdown.',
      readyBtn: 'Ready Up',
      unreadyBtn: 'Cancel Ready',
      readyState: 'Ready',
      notReadyState: 'Not Ready',
      startCountdown: 'Match starts in',
      leaveRoom: 'Leave Room',
      targetDistance: 'Duel Target Distance',
      connectionOnline: 'Connected',
      connectionOffline: 'Connection Lost — Reconnecting...',
      reconnectNotice: 'Active duel session found. Reconnecting to room...',
      roomNotFound: 'No duel room found with that code.',
      roomFull: 'This room is already full or has started.',
      cantJoinOwn: 'You cannot join your own room as the opponent.',
      publicRoomsTitle: 'Open Public Rooms',
      noOpenRooms: 'No public rooms waiting right now.',
      joinThisRoom: 'Join Room',
    },
    hud: {
      distance: 'Distance',
      score: 'Score',
      coins: 'Coins',
      speed: 'Speed',
      multiplier: 'Multiplier',
      area: 'Zone',
      opponent: 'Rival',
      you: 'You',
      alive: 'Running',
      eliminated: 'Crashed',
      disconnected: 'Disconnected',
      countdownGo: 'RUN!',
      pause: 'Pause',
      mute: 'Mute Audio',
      unmute: 'Unmute Audio',
      left: 'Left',
      right: 'Right',
      jump: 'Jump',
      slide: 'Slide',
    },
    modals: {
      pausedTitle: 'Game Paused',
      resume: 'Resume',
      restart: 'Restart Run',
      exitHome: 'Exit to Home',
      gameOverTitle: 'Run Ended',
      victoryTitle: 'Duel Victory!',
      defeatTitle: 'Duel Defeat',
      drawTitle: 'Draw Match',
      reviveBtn: 'Revive Runner',
      reviveCost: 'Spend 25 Coins',
      notEnoughCoins: 'Need 25 coins to revive',
      playAgain: 'Play Again',
      backToLobby: 'Back to Lobby',
      newBest: 'New Personal Best!',
      validatedScore: 'Server-Verified Score',
      finalScore: 'Final Score',
      distanceReached: 'Distance',
      coinsEarned: 'Coins Collected',
      opponentProgress: 'Rival Distance',
      howToPlayTitle: 'How to Play esCApeLL',
      pcControls: 'PC / Keyboard Controls',
      mobileControls: 'Mobile / Touch Controls',
      pcRules: [
        'A or Left Arrow: Switch to left lane',
        'D or Right Arrow: Switch to right lane',
        'W, Up Arrow, or Space: Jump over broken cars, barriers, and bridge gaps',
        'S or Down Arrow: Slide beneath laser gates and suspended debris',
        'Esc: Pause anytime',
      ],
      mobileRules: [
        'Swipe Left / Right: Snap between lanes',
        'Swipe Up: Leap over low obstacles and gaps',
        'Swipe Down: Slide under overhead hazards',
        'Optional on-screen touch buttons are available at the bottom corners',
      ],
      close: 'Close',
    },
    leaderboard: {
      title: 'Global Leaderboard',
      subtitle: 'Live Cloud Firestore rankings with server-verified run signatures.',
      global: 'Global',
      daily: 'Daily',
      weekly: 'Weekly',
      rank: 'Rank',
      player: 'Survivor',
      character: 'Runner',
      score: 'Score',
      distance: 'Distance',
      loading: 'Loading rankings...',
      empty: 'No runs recorded for this period yet. Claim the first spot!',
      error: 'Unable to load leaderboard. Please check your connection.',
      verified: 'Verified',
    },
    profile: {
      title: 'Survivor Profile',
      signInTitle: 'Sign In to esCApeLL',
      signInDesc: 'Sync your high score, coins, match history, and preferences across sessions.',
      googleLogin: 'Continue with Google',
      emailTab: 'Email Sign In',
      registerTab: 'Register',
      emailLabel: 'Email Address',
      passwordLabel: 'Password (min. 6 chars)',
      usernameLabel: 'Survivor Name',
      loginBtn: 'Sign In',
      registerBtn: 'Create Account',
      guestBtn: 'Play as Guest',
      guestBadge: 'Guest Session',
      logoutBtn: 'Sign Out',
      saveProfile: 'Save Profile',
      saved: 'Saved!',
      avatarLabel: 'Choose Avatar',
      statsTitle: 'Career Statistics',
      highScore: 'High Score',
      bestDistance: 'Best Distance',
      totalCoins: 'Total Coins',
      totalGames: 'Total Runs',
      wins: 'Duel Wins',
      losses: 'Duel Losses',
      totalDistance: 'Total Distance',
      historyTitle: 'Recent Match History',
      noHistory: 'No matches played yet.',
      providerDisabledHint:
        'This sign-in method is not enabled in Firebase Console yet. Use Google Sign-In or enable Email/Password & Anonymous in Firebase Authentication -> Sign-in method.',
    },
    settings: {
      title: 'Settings',
      language: 'Interface Language',
      theme: 'Day / Night Theme',
      sound: 'Sound Effects',
      music: 'Background Music',
      on: 'On',
      off: 'Off',
      graphics: '3D Graphics Quality',
      graphicsLow: 'Low',
      graphicsMedium: 'Medium',
      graphicsHigh: 'High',
      controls: 'Controls Summary',
      controlsSummary: 'PC: A/D/W/S, Arrows, Space, Esc · Mobile: Swipe & Touch Pad',
      creditsTitle: 'Credits',
    },
    credits: {
      title: 'esCApeLL',
      createdBy: 'CREATED BY',
      ideaBy: 'IDEA BY',
    },
    notifications: {
      roomCreated: 'Duel room created!',
      scoreSaved: 'Score verified & saved to leaderboard.',
      scoreRejected: 'Server rejected anomalous score.',
      revived: 'Revived! Keep running!',
      errorGeneric: 'Network issue encountered. Please retry.',
    },
  },
};
