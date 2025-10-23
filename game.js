// Elon's Mario Game - Moteur de jeu principal
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        // État du jeu
        this.gameState = 'start'; // start, playing, paused, gameOver
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        
        // Caméra
        this.camera = {
            x: 0,
            y: 0,
            targetX: 0,
            targetY: 0,
            followSpeed: 0.1
        };
        
        // Personnage principal (sera créé après sélection)
        this.player = null;
        
        // Niveaux et plateformes
        this.platforms = [];
        this.enemies = [];
        this.collectibles = [];
        this.particles = [];
        this.flag = null;
        this.springs = [];
        this.mushrooms = [];
        
        // Système de décors
        this.backgroundElements = [];
        this.foregroundElements = [];
        this.clouds = [];
        this.trees = [];
        this.mountains = [];
        this.flowers = [];
        this.bushes = [];
        
        // Système de personnages
        this.availableCharacters = this.createCharacters();
        this.selectedCharacter = 'sonic'; // Par défaut
        
        // Système de niveaux
        this.maxLevel = 5;
        this.levelData = this.createLevelData();
        
        // Dimensions du monde (beaucoup plus large pour des niveaux longs)
        this.worldWidth = 6000; // 6x plus long pour 2 minutes de jeu
        this.worldHeight = this.height;
        
        // Système de sons
        this.audioContext = null;
        this.sounds = {};
        this.music = {
            isPlaying: false,
            isMuted: false,
            currentNote: 0,
            tempo: 120, // BPM
            noteDuration: 0.5, // Durée de chaque note
            lastNoteTime: 0,
            melody: [],
            bass: [],
            rhythm: []
        };
        this.setupAudio();
        
        // Contrôles
        this.keys = {};
        this.setupControls();
        
        // Démarrer le jeu
        this.setupStartScreen();
        this.gameLoop();
    }
    
    setupAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.createSounds();
        } catch (e) {
            console.log('Audio non supporté');
        }
    }
    
    createSounds() {
        if (!this.audioContext) return;
        
        // Son de saut (bip court et aigu)
        this.sounds.jump = () => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(1200, this.audioContext.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.1);
        };
        
        // Son de collecte de pièce (ding mélodieux)
        this.sounds.coin = () => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(1000, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(1500, this.audioContext.currentTime + 0.2);
            
            gainNode.gain.setValueAtTime(0.4, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.2);
        };
        
        // Son d'élimination d'ennemi (bip plus grave)
        this.sounds.enemy = () => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.15);
            
            gainNode.gain.setValueAtTime(0.5, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.15);
        };
        
        // Son de victoire (mélodie joyeuse)
        this.sounds.victory = () => {
            this.playVictoryMelody();
        };
        
        // Son de game over (mélodie triste)
        this.sounds.gameOver = () => {
            this.playGameOverMelody();
        };
        
        // Créer la musique de fond
        this.createBackgroundMusic();
    }
    
    createBackgroundMusic() {
        // Musique par défaut (forêt)
        this.createThemeMusic();
    }
    
    createThemeMusic() {
        const levelInfo = this.levelData[this.level];
        const theme = levelInfo ? levelInfo.theme : 'forest';
        
        if (theme === 'forest') {
            // Musique de forêt (douce et naturelle)
        this.music.melody = [
            {freq: 523.25, duration: 0.25}, // C5
            {freq: 523.25, duration: 0.25}, // C5
            {freq: 0, duration: 0.25},      // Pause
            {freq: 523.25, duration: 0.25}, // C5
            {freq: 0, duration: 0.25},      // Pause
            {freq: 392.00, duration: 0.25}, // G4
            {freq: 523.25, duration: 0.5},  // C5
            {freq: 0, duration: 0.25},      // Pause
            ];
        this.music.bass = [
            {freq: 130.81, duration: 0.5},  // C3
            {freq: 0, duration: 0.5},       // Pause
            {freq: 130.81, duration: 0.5},  // C3
            {freq: 0, duration: 0.5},       // Pause
            ];
        this.music.rhythm = [
            {freq: 200, duration: 0.125},   // Kick
            {freq: 0, duration: 0.125},     // Pause
            {freq: 400, duration: 0.125},   // Snare
            {freq: 0, duration: 0.125},     // Pause
            ];
        } else if (theme === 'ice') {
            // Musique de glace (cristalline)
            this.music.melody = [
                {freq: 1046.50, duration: 0.2}, // C6
                {freq: 1174.66, duration: 0.2}, // D6
                {freq: 1318.51, duration: 0.2}, // E6
                {freq: 0, duration: 0.2},       // Pause
                {freq: 1046.50, duration: 0.2}, // C6
                {freq: 1174.66, duration: 0.2}, // D6
                {freq: 1318.51, duration: 0.4}, // E6
                {freq: 0, duration: 0.2},       // Pause
            ];
            this.music.bass = [
                {freq: 261.63, duration: 0.4},  // C4
                {freq: 0, duration: 0.4},       // Pause
                {freq: 261.63, duration: 0.4},  // C4
                {freq: 0, duration: 0.4},       // Pause
            ];
            this.music.rhythm = [
                {freq: 800, duration: 0.1},     // Cloche
                {freq: 0, duration: 0.1},       // Pause
                {freq: 1000, duration: 0.1},    // Cloche aiguë
                {freq: 0, duration: 0.1},       // Pause
            ];
        } else if (theme === 'beach') {
            // Musique de plage (joyeuse)
            this.music.melody = [
                {freq: 659.25, duration: 0.2},  // E5
                {freq: 659.25, duration: 0.2},  // E5
                {freq: 523.25, duration: 0.2},  // C5
                {freq: 659.25, duration: 0.2},  // E5
                {freq: 783.99, duration: 0.2},  // G5
                {freq: 659.25, duration: 0.2},  // E5
                {freq: 523.25, duration: 0.4},  // C5
                {freq: 0, duration: 0.2},       // Pause
            ];
            this.music.bass = [
                {freq: 196.00, duration: 0.3},  // G3
                {freq: 0, duration: 0.1},       // Pause
                {freq: 196.00, duration: 0.3},  // G3
                {freq: 0, duration: 0.1},       // Pause
            ];
            this.music.rhythm = [
                {freq: 300, duration: 0.1},     // Percussion légère
                {freq: 0, duration: 0.1},       // Pause
                {freq: 500, duration: 0.1},     // Percussion
                {freq: 0, duration: 0.1},       // Pause
            ];
        } else if (theme === 'fire') {
            // Musique de feu (intense)
            this.music.melody = [
                {freq: 440.00, duration: 0.15}, // A4
                {freq: 0, duration: 0.05},      // Pause
                {freq: 440.00, duration: 0.15}, // A4
                {freq: 0, duration: 0.05},      // Pause
                {freq: 554.37, duration: 0.15}, // C#5
                {freq: 0, duration: 0.05},      // Pause
                {freq: 440.00, duration: 0.15}, // A4
                {freq: 0, duration: 0.05},      // Pause
            ];
            this.music.bass = [
                {freq: 110.00, duration: 0.2},  // A2
                {freq: 0, duration: 0.2},       // Pause
                {freq: 110.00, duration: 0.2},  // A2
                {freq: 0, duration: 0.2},       // Pause
            ];
            this.music.rhythm = [
                {freq: 150, duration: 0.08},    // Kick lourd
                {freq: 0, duration: 0.08},      // Pause
                {freq: 300, duration: 0.08},    // Snare
                {freq: 0, duration: 0.08},      // Pause
            ];
        } else if (theme === 'water') {
            // Musique d'eau (fluide)
            this.music.melody = [
                {freq: 392.00, duration: 0.3},  // G4
                {freq: 440.00, duration: 0.3},  // A4
                {freq: 493.88, duration: 0.3},  // B4
                {freq: 523.25, duration: 0.3},  // C5
                {freq: 493.88, duration: 0.3},  // B4
                {freq: 440.00, duration: 0.3},  // A4
                {freq: 392.00, duration: 0.6},  // G4
                {freq: 0, duration: 0.3},       // Pause
            ];
            this.music.bass = [
                {freq: 98.00, duration: 0.6},   // G2
                {freq: 0, duration: 0.6},       // Pause
                {freq: 98.00, duration: 0.6},   // G2
                {freq: 0, duration: 0.6},       // Pause
            ];
            this.music.rhythm = [
                {freq: 600, duration: 0.15},    // Bulles
                {freq: 0, duration: 0.15},      // Pause
                {freq: 800, duration: 0.15},    // Bulles aiguës
                {freq: 0, duration: 0.15},      // Pause
            ];
        }
    }
    
    playSound(soundName) {
        if (this.audioContext && this.sounds[soundName]) {
            // Redémarrer le contexte audio si nécessaire
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            this.sounds[soundName]();
        }
    }
    
    startBackgroundMusic() {
        if (!this.audioContext || this.music.isPlaying || this.music.isMuted) return;
        
        this.music.isPlaying = true;
        this.music.currentNote = 0;
        this.music.lastNoteTime = this.audioContext.currentTime;
        this.playMusicLoop();
    }
    
    stopBackgroundMusic() {
        this.music.isPlaying = false;
    }
    
    toggleMusic() {
        this.music.isMuted = !this.music.isMuted;
        if (this.music.isMuted) {
            this.stopBackgroundMusic();
        } else {
            this.startBackgroundMusic();
        }
    }
    
    playMusicLoop() {
        if (!this.music.isPlaying || this.music.isMuted) return;
        
        const currentTime = this.audioContext.currentTime;
        const timePerNote = 60 / this.music.tempo / 2; // Tempo en BPM
        
        // Jouer la mélodie
        if (this.music.melody[this.music.currentNote % this.music.melody.length]) {
            const note = this.music.melody[this.music.currentNote % this.music.melody.length];
            if (note.freq > 0) {
                this.playNote(note.freq, note.duration * timePerNote, 0.1, 'sine');
            }
        }
        
        // Jouer la basse
        if (this.music.bass[this.music.currentNote % this.music.bass.length]) {
            const note = this.music.bass[this.music.currentNote % this.music.bass.length];
            if (note.freq > 0) {
                this.playNote(note.freq, note.duration * timePerNote, 0.15, 'triangle');
            }
        }
        
        // Jouer le rythme
        if (this.music.rhythm[this.music.currentNote % this.music.rhythm.length]) {
            const note = this.music.rhythm[this.music.currentNote % this.music.rhythm.length];
            if (note.freq > 0) {
                this.playNote(note.freq, note.duration * timePerNote, 0.08, 'square');
            }
        }
        
        this.music.currentNote++;
        
        // Programmer la note suivante
        setTimeout(() => {
            this.playMusicLoop();
        }, timePerNote * 1000);
    }
    
    playNote(frequency, duration, volume, waveType = 'sine') {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = waveType;
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    playVictoryMelody() {
        if (!this.audioContext) return;
        
        const melody = [
            {freq: 523.25, duration: 0.3}, // C5
            {freq: 659.25, duration: 0.3}, // E5
            {freq: 783.99, duration: 0.3}, // G5
            {freq: 1046.50, duration: 0.6}, // C6
            {freq: 0, duration: 0.2}, // Pause
            {freq: 1046.50, duration: 0.3}, // C6
            {freq: 1174.66, duration: 0.3}, // D6
            {freq: 1318.51, duration: 0.6} // E6
        ];
        
        melody.forEach((note, index) => {
            setTimeout(() => {
                if (note.freq > 0) {
                    this.playNote(note.freq, note.duration, 0.3, 'sine');
                }
            }, index * 300);
        });
    }
    
    playGameOverMelody() {
        if (!this.audioContext) return;
        
        const melody = [
            {freq: 392.00, duration: 0.4}, // G4
            {freq: 349.23, duration: 0.4}, // F4
            {freq: 311.13, duration: 0.4}, // D#4
            {freq: 293.66, duration: 0.4}, // D4
            {freq: 0, duration: 0.2}, // Pause
            {freq: 293.66, duration: 0.4}, // D4
            {freq: 311.13, duration: 0.4}, // D#4
            {freq: 349.23, duration: 0.8} // F4
        ];
        
        melody.forEach((note, index) => {
            setTimeout(() => {
                if (note.freq > 0) {
                    this.playNote(note.freq, note.duration, 0.3, 'triangle');
                }
            }, index * 400);
        });
    }
    
    createLevelData() {
        return {
            1: { 
                name: "Forêt Enchantée", 
                theme: "forest",
                difficulty: 1, 
                enemyCount: 0.1, 
                collectibleCount: 0.6,
                skyColor: '#87CEEB',
                groundColor: '#228B22',
                platformColor: '#8B4513',
                decorationColor: '#32CD32'
            },
            2: { 
                name: "Glacier Gelé", 
                theme: "ice",
                difficulty: 1.5, 
                enemyCount: 0.15, 
                collectibleCount: 0.5,
                skyColor: '#B0E0E6',
                groundColor: '#F0F8FF',
                platformColor: '#E6F3FF',
                decorationColor: '#87CEEB'
            },
            3: { 
                name: "Plage Tropicale", 
                theme: "beach",
                difficulty: 2, 
                enemyCount: 0.2, 
                collectibleCount: 0.4,
                skyColor: '#87CEEB',
                groundColor: '#F4A460',
                platformColor: '#DEB887',
                decorationColor: '#FFD700'
            },
            4: { 
                name: "Volcan Enflammé", 
                theme: "fire",
                difficulty: 2.5, 
                enemyCount: 0.25, 
                collectibleCount: 0.3,
                skyColor: '#FF4500',
                groundColor: '#8B0000',
                platformColor: '#A0522D',
                decorationColor: '#FF6347'
            },
            5: { 
                name: "Océan Profond", 
                theme: "water",
                difficulty: 3, 
                enemyCount: 0.3, 
                collectibleCount: 0.2,
                skyColor: '#191970',
                groundColor: '#000080',
                platformColor: '#4682B4',
                decorationColor: '#00CED1'
            }
        };
    }
    
    createCharacters() {
        return {
            sonic: {
                name: "Sonic",
                color: '#00BFFF',
                description: "Le hérisson bleu rapide",
                render: this.renderSonic
            },
            mario: {
                name: "Mario",
                color: '#FF0000',
                description: "Le plombier moustachu",
                render: this.renderMario
            },
            knuckles: {
                name: "Knuckles",
                color: '#8B0000',
                description: "Le gardien des émeraudes",
                render: this.renderKnuckles
            },
            captain_barnacles: {
                name: "Captain Barnacles",
                color: '#FFFFFF',
                description: "L'ours polaire capitaine",
                render: this.renderCaptainBarnacles
            },
            kwazii: {
                name: "Kwazii",
                color: '#FF8C00',
                description: "Le chat pirate orange",
                render: this.renderKwazii
            },
            ninjago: {
                name: "Ninjago",
                color: '#32CD32',
                description: "Le ninja vert",
                render: this.renderNinjago
            },
            spongebob: {
                name: "Bob l'éponge",
                color: '#FFFF00',
                description: "L'éponge carrée",
                render: this.renderSpongebob
            },
            blippi: {
                name: "Blippi",
                color: '#FF8C00',
                description: "L'éducateur coloré",
                render: this.renderBlippi
            }
        };
    }
    
    setupControls() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'Space') {
                e.preventDefault();
            }
            // Touche M pour couper/remettre la musique
            if (e.code === 'KeyM') {
                this.toggleMusic();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }
    
    setupStartScreen() {
        const startButton = document.getElementById('startButton');
        startButton.addEventListener('click', () => {
            // Activer l'audio au premier clic
            if (this.audioContext && this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            this.startGame();
        });
        
        // Configuration de la sélection de personnages
        this.setupCharacterSelection();
    }
    
    setupCharacterSelection() {
        const characterOptions = document.querySelectorAll('.character-option');
        
        characterOptions.forEach(option => {
            option.addEventListener('click', () => {
                // Retirer la sélection précédente
                characterOptions.forEach(opt => opt.classList.remove('selected'));
                
                // Sélectionner le nouveau personnage
                option.classList.add('selected');
                this.selectedCharacter = option.dataset.character;
                
                // Mettre à jour la couleur du personnage
                const character = this.availableCharacters[this.selectedCharacter];
                if (character) {
                    this.player.color = character.color;
                }
            });
        });
        
        // Sélectionner Sonic par défaut
        const sonicOption = document.querySelector('[data-character="sonic"]');
        if (sonicOption) {
            sonicOption.classList.add('selected');
        }
        
        // Les prévisualisations seront initialisées après le chargement complet
    }
    
    setupCharacterPreviews() {
        // Dessiner les personnages sur les canvas de prévisualisation
        Object.keys(this.availableCharacters).forEach(characterKey => {
            const canvas = document.getElementById(`preview-${characterKey}`);
            if (canvas) {
                const ctx = canvas.getContext('2d');
                this.drawCharacterPreview(ctx, characterKey);
            }
        });
    }
    
    drawCharacterPreview(ctx, characterKey) {
        // Effacer le canvas
        ctx.clearRect(0, 0, 60, 60);
        
        // Créer un joueur temporaire pour le rendu
        const tempPlayer = {
            x: 30,
            y: 30,
            width: 20,
            height: 20,
            direction: 1,
            animation: 0,
            color: this.availableCharacters[characterKey].color
        };
        
        // Test simple pour vérifier que le canvas fonctionne
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(10, 10, 40, 40);
        
        // Dessiner le personnage selon la clé
        try {
            switch(characterKey) {
                case 'sonic':
                    Game.prototype.renderSonic.call(this, ctx, tempPlayer);
                    break;
                case 'mario':
                    Game.prototype.renderMario.call(this, ctx, tempPlayer);
                    break;
                case 'knuckles':
                    Game.prototype.renderKnuckles.call(this, ctx, tempPlayer);
                    break;
                case 'captain_barnacles':
                    Game.prototype.renderCaptainBarnacles.call(this, ctx, tempPlayer);
                    break;
                case 'kwazii':
                    Game.prototype.renderKwazii.call(this, ctx, tempPlayer);
                    break;
                case 'ninjago':
                    Game.prototype.renderNinjago.call(this, ctx, tempPlayer);
                    break;
                case 'spongebob':
                    Game.prototype.renderSpongebob.call(this, ctx, tempPlayer);
                    break;
                case 'blippi':
                    Game.prototype.renderBlippi.call(this, ctx, tempPlayer);
                    break;
                default:
                    Game.prototype.renderSonic.call(this, ctx, tempPlayer);
            }
        } catch (error) {
            console.error('Erreur lors du rendu du personnage:', error);
            // Dessiner un carré de couleur en cas d'erreur
            ctx.fillStyle = this.availableCharacters[characterKey].color;
            ctx.fillRect(20, 20, 20, 20);
        }
    }
    
    startGame() {
        // Créer le joueur avec le personnage sélectionné
        this.player = new Player(50, this.height - 100);
        const character = this.availableCharacters[this.selectedCharacter];
        if (character) {
            this.player.color = character.color;
        }
        
        // Initialiser la caméra
        this.camera.x = 0;
        this.camera.y = 0;
        this.camera.targetX = 0;
        this.camera.targetY = 0;
        
        this.gameState = 'playing';
        document.getElementById('startScreen').style.display = 'none';
        this.generateLevel();
        // Démarrer la musique de fond
        this.startBackgroundMusic();
    }
    
    generateLevel() {
        // Générer les plateformes du niveau
        this.platforms = [];
        this.enemies = [];
        this.collectibles = [];
        
        const levelInfo = this.levelData[this.level];
        const platformCount = 60; // Beaucoup plus de plateformes pour 2 minutes
        
        // Plateforme de départ
        this.platforms.push(new Platform(0, this.height - 30, 300, 30));
        
        // Générer un niveau long et varié selon la difficulté
        for (let i = 0; i < platformCount; i++) {
            const x = 250 + i * 100; // Espacement régulier
            const difficulty = levelInfo.difficulty;
            
            // Variation de hauteur basée sur la difficulté (assurer visibilité)
            const heightVariation = Math.max(80, 60 + Math.sin(i * 0.2) * 80 * difficulty);
            const y = this.height - heightVariation;
            const width = 100 + Math.random() * 100; // Largeurs variées
            
            // Créer des plateformes mobiles ou statiques
            if (Math.random() < 0.3) {
                // Plateforme mobile verticale
                this.platforms.push(new MovingPlatform(x, y, width, 30, 'vertical'));
            } else {
                // Plateforme statique
                this.platforms.push(new Platform(x, y, width, 30));
            }
            
            // Ajouter des plateformes intermédiaires pour faciliter les sauts
            if (i < platformCount - 2 && Math.random() < 0.3) {
                const midX = x + width/2 + (Math.random() - 0.5) * 120;
                const midY = y + 75 + Math.random() * 45;
                this.platforms.push(new Platform(midX, midY, 90, 22));
            }
            
            // Ajouter des ennemis selon la difficulté
            if (Math.random() < levelInfo.enemyCount) {
                this.enemies.push(new Enemy(x + width/2, y - 30));
            }
            
            // Ajouter des collectibles selon la difficulté
            if (Math.random() < levelInfo.collectibleCount) {
                this.collectibles.push(new Collectible(x + width/2, y - 40));
            }
            
            // Ajouter des ressorts (moins fréquents)
            if (Math.random() < 0.1) {
                this.springs.push(new Spring(x + width/2, y - 20));
            }
            
            // Ajouter des champignons (très rares)
            if (Math.random() < 0.05) {
                this.mushrooms.push(new Mushroom(x + width/2, y - 25));
            }
        }
        
        // Plateforme de fin
        this.platforms.push(new Platform(this.worldWidth - 300, this.height - 30, 300, 30));
        
        // Créer le drapeau à la fin
        this.flag = new Flag(this.worldWidth - 150, this.height - 120);
        
        // Générer les décors
        this.generateDecorations();
    }
    
    generateDecorations() {
        // Vider les décors existants
        this.clouds = [];
        this.trees = [];
        this.mountains = [];
        this.bushes = [];
        this.flowers = [];
        
        // Générer les nuages
        for (let i = 0; i < 15; i++) {
            this.clouds.push(new Cloud(
                Math.random() * this.worldWidth,
                Math.random() * (this.height * 0.4),
                Math.random() * 0.5 + 0.5
            ));
        }
        
        // Générer les montagnes en arrière-plan
        for (let i = 0; i < 8; i++) {
            this.mountains.push(new Mountain(
                i * (this.worldWidth / 8),
                this.height - 100,
                Math.random() * 0.3 + 0.7
            ));
        }
        
        // Générer les arbres
        for (let i = 0; i < 20; i++) {
            this.trees.push(new Tree(
                Math.random() * this.worldWidth,
                this.height - 20,
                Math.random() * 0.4 + 0.6
            ));
        }
        
        // Générer les buissons
        for (let i = 0; i < 15; i++) {
            this.bushes.push(new Bush(
                Math.random() * this.worldWidth,
                this.height - 20,
                Math.random() * 0.3 + 0.4
            ));
        }
        
        // Générer les fleurs
        for (let i = 0; i < 30; i++) {
            this.flowers.push(new Flower(
                Math.random() * this.worldWidth,
                this.height - 20,
                Math.random() * 0.2 + 0.3
            ));
        }
    }
    
    update() {
        if (this.gameState !== 'playing') return;
        
        // Mettre à jour les plateformes mobiles
        this.platforms.forEach(platform => platform.update());
        
        // Mettre à jour les décors
        this.clouds.forEach(cloud => cloud.update());
        this.trees.forEach(tree => tree.update());
        this.mountains.forEach(mountain => mountain.update());
        this.bushes.forEach(bush => bush.update());
        this.flowers.forEach(flower => flower.update());
        
        // Mettre à jour le joueur
        this.player.update(this.keys, this.platforms);
        
        // Mettre à jour la caméra pour suivre le joueur
        this.updateCamera();
        
        // Mettre à jour les ennemis
        this.enemies.forEach((enemy, index) => {
            enemy.update(this.platforms);
            
            // Vérifier les collisions avec le joueur
            if (this.checkCollision(this.player, enemy)) {
                // Vérifier si le joueur saute sur l'ennemi (venant du dessus)
                if (this.player.velocityY > 0 && this.player.y < enemy.y) {
                    // Saut sur l'ennemi - l'éliminer
                    this.enemies.splice(index, 1);
                    this.score += 200;
                    this.updateUI();
                    this.playSound('enemy');
                    this.addParticles(enemy.x, enemy.y, '#FF0000');
                    // Faire rebondir le joueur
                    this.player.velocityY = -this.player.jumpPower * 0.7;
                } else {
                    // Collision latérale - vérifier le système de power-up
                    if (this.player.takeDamage()) {
                        // Perte de vie normale
                        this.playerHit();
                    } else {
                        // Perte du power-up seulement
                        this.addParticles(this.player.x, this.player.y, '#FF0000');
                    }
                }
            }
        });
        
        // Mettre à jour les collectibles
        this.collectibles.forEach((collectible, index) => {
            if (this.checkCollision(this.player, collectible)) {
                this.collectibles.splice(index, 1);
                this.score += 100;
                this.updateUI();
                this.playSound('coin');
                this.addParticles(collectible.x, collectible.y, '#FFD700');
            }
        });
        
        // Mettre à jour les ressorts
        this.springs.forEach(spring => {
            spring.update();
            if (this.checkCollision(this.player, spring)) {
                spring.activate();
                this.player.velocityY = -this.player.jumpPower * 1.5; // Saut 1.5x plus puissant (réduit)
                this.playSound('jump');
                this.addParticles(spring.x, spring.y, '#FFD700');
            }
        });
        
        // Mettre à jour les champignons
        this.mushrooms.forEach((mushroom, index) => {
            mushroom.update();
            if (this.checkCollision(this.player, mushroom)) {
                this.mushrooms.splice(index, 1);
                this.player.powerUp('mushroom');
                this.score += 500;
                this.updateUI();
                this.playSound('coin'); // Utiliser le son de pièce pour l'instant
                this.addParticles(mushroom.x, mushroom.y, '#FF0000');
            }
        });
        
        // Mettre à jour les particules
        this.particles.forEach((particle, index) => {
            particle.update();
            if (particle.life <= 0) {
                this.particles.splice(index, 1);
            }
        });
        
        // Vérifier si le joueur est tombé
        if (this.player.y > this.height) {
            this.playerHit();
        }
        
        // Vérifier la collision avec le drapeau
        if (this.flag && this.checkCollision(this.player, this.flag)) {
            this.victory();
        }
    }
    
    updateCamera() {
        if (!this.player) return;
        
        // Centrer la caméra sur le joueur
        this.camera.targetX = this.player.x - this.width / 2;
        this.camera.targetY = this.player.y - this.height / 2;
        
        // Limiter la caméra aux bords du monde (mais permettre d'aller plus loin)
        this.camera.targetX = Math.max(0, Math.min(this.camera.targetX, this.worldWidth - this.width));
        this.camera.targetY = Math.max(0, Math.min(this.camera.targetY, this.worldHeight - this.height));
        
        // Interpolation douce de la caméra
        this.camera.x += (this.camera.targetX - this.camera.x) * this.camera.followSpeed;
        this.camera.y += (this.camera.targetY - this.camera.y) * this.camera.followSpeed;
    }
    
    render() {
        // Effacer le canvas
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Si le jeu n'est pas en cours, ne pas dessiner le monde
        if (this.gameState !== 'playing') {
            this.renderEndScreens();
            return;
        }
        
        // Sauvegarder le contexte
        this.ctx.save();
        
        // Appliquer la transformation de la caméra
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        // Dessiner le ciel selon le thème du niveau
        const levelInfo = this.levelData[this.level];
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        
        if (levelInfo.theme === 'forest') {
            gradient.addColorStop(0, '#87CEEB');
            gradient.addColorStop(0.7, '#98FB98');
            gradient.addColorStop(1, '#228B22');
        } else if (levelInfo.theme === 'ice') {
            gradient.addColorStop(0, '#B0E0E6');
            gradient.addColorStop(0.7, '#F0F8FF');
            gradient.addColorStop(1, '#E6F3FF');
        } else if (levelInfo.theme === 'beach') {
            gradient.addColorStop(0, '#87CEEB');
            gradient.addColorStop(0.7, '#FFE4B5');
            gradient.addColorStop(1, '#F4A460');
        } else if (levelInfo.theme === 'fire') {
            gradient.addColorStop(0, '#FF4500');
            gradient.addColorStop(0.7, '#FF6347');
            gradient.addColorStop(1, '#8B0000');
        } else if (levelInfo.theme === 'water') {
            gradient.addColorStop(0, '#191970');
            gradient.addColorStop(0.7, '#000080');
            gradient.addColorStop(1, '#4682B4');
        } else {
            // Thème par défaut
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.7, '#98FB98');
        gradient.addColorStop(1, '#8B4513');
        }
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.worldWidth, this.height);
        
        // Dessiner les montagnes (arrière-plan lointain) avec parallaxe
        this.ctx.save();
        this.ctx.translate(-this.camera.x * 0.3, 0); // Parallaxe lente
        this.mountains.forEach(mountain => mountain.render(this.ctx));
        this.ctx.restore();
        
        // Dessiner les nuages avec parallaxe
        this.ctx.save();
        this.ctx.translate(-this.camera.x * 0.1, 0); // Parallaxe très lente
        this.clouds.forEach(cloud => cloud.render(this.ctx));
        this.ctx.restore();
        
        // Dessiner les plateformes
        this.platforms.forEach(platform => platform.render(this.ctx));
        
        // Dessiner les arbres avec parallaxe légère
        this.ctx.save();
        this.ctx.translate(-this.camera.x * 0.7, 0); // Parallaxe moyenne
        this.trees.forEach(tree => tree.render(this.ctx));
        this.ctx.restore();
        
        // Dessiner les buissons
        this.ctx.save();
        this.ctx.translate(-this.camera.x * 0.8, 0); // Parallaxe légère
        this.bushes.forEach(bush => bush.render(this.ctx));
        this.ctx.restore();
        
        // Dessiner les fleurs
        this.ctx.save();
        this.ctx.translate(-this.camera.x * 0.9, 0); // Parallaxe très légère
        this.flowers.forEach(flower => flower.render(this.ctx));
        this.ctx.restore();
        
        // Dessiner les collectibles
        this.collectibles.forEach(collectible => collectible.render(this.ctx));
        
        // Dessiner les ressorts
        this.springs.forEach(spring => spring.render(this.ctx));
        
        // Dessiner les champignons
        this.mushrooms.forEach(mushroom => mushroom.render(this.ctx));
        
        // Dessiner les ennemis
        this.enemies.forEach(enemy => enemy.render(this.ctx));
        
        // Dessiner les particules
        this.particles.forEach(particle => particle.render(this.ctx));
        
        // Dessiner le drapeau
        if (this.flag) {
            this.flag.update();
            this.flag.render(this.ctx);
        }
        
        // Dessiner le joueur
        if (this.player) {
            this.player.render(this.ctx);
        }
        
        // Restaurer le contexte
        this.ctx.restore();
    }
    
    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    playerHit() {
        this.lives--;
        this.updateUI();
        
        if (this.lives <= 0) {
            this.gameOver();
        } else {
            // Repositionner le joueur
            this.player.x = 50;
            this.player.y = this.height - 100;
            this.player.velocityY = 0;
        }
    }
    
    victory() {
        this.gameState = 'victory';
        this.stopBackgroundMusic();
        this.playSound('victory');
        this.score += 1000;
        this.updateUI();
    }
    
    nextLevel() {
        if (this.level >= this.maxLevel) {
            this.gameComplete();
            return;
        }
        
        this.level++;
        this.gameState = 'playing';
        this.generateLevel();
        this.player.x = 50;
        this.player.y = this.height - 100;
        // Réinitialiser la caméra
        this.camera.x = 0;
        this.camera.y = 0;
        this.camera.targetX = 0;
        this.camera.targetY = 0;
        // Changer la musique selon le thème
        this.createThemeMusic();
        this.startBackgroundMusic();
    }
    
    gameComplete() {
        this.gameState = 'complete';
        this.stopBackgroundMusic();
        this.playSound('victory');
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        this.stopBackgroundMusic();
        this.playSound('gameOver');
    }
    
    renderEndScreens() {
        if (this.gameState === 'victory') {
            this.renderVictoryScreen();
        } else if (this.gameState === 'gameOver') {
            this.renderGameOverScreen();
        } else if (this.gameState === 'complete') {
            this.renderCompleteScreen();
        }
    }
    
    renderVictoryScreen() {
        // Overlay semi-transparent
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Texte de victoire
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('BRAVO!', this.width / 2, this.height / 2 - 50);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = '24px Arial';
        this.ctx.fillText(`Tu passes au niveau ${this.level + 1}`, this.width / 2, this.height / 2);
        
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = '18px Arial';
        this.ctx.fillText('Appuyez sur ESPACE pour continuer', this.width / 2, this.height / 2 + 50);
        
        // Gérer la touche espace pour passer au niveau suivant
        if (this.keys['Space']) {
            this.keys['Space'] = false; // Réinitialiser la touche
            this.nextLevel();
        }
    }
    
    renderGameOverScreen() {
        // Overlay semi-transparent
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Texte de game over
        this.ctx.fillStyle = '#FF0000';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.width / 2, this.height / 2 - 50);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = '24px Arial';
        this.ctx.fillText(`Score final: ${this.score}`, this.width / 2, this.height / 2);
        
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = '18px Arial';
        this.ctx.fillText('Appuyez sur R pour recommencer', this.width / 2, this.height / 2 + 50);
        
        // Gérer la touche R pour recommencer
        if (this.keys['KeyR']) {
            this.keys['KeyR'] = false; // Réinitialiser la touche
            location.reload();
        }
    }
    
    renderCompleteScreen() {
        // Overlay semi-transparent
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Texte de fin complète
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('FÉLICITATIONS!', this.width / 2, this.height / 2 - 100);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = '24px Arial';
        this.ctx.fillText('Tu as terminé tous les niveaux!', this.width / 2, this.height / 2 - 50);
        this.ctx.fillText(`Score final: ${this.score}`, this.width / 2, this.height / 2);
        
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = '18px Arial';
        this.ctx.fillText('Appuyez sur R pour recommencer', this.width / 2, this.height / 2 + 50);
        
        // Gérer la touche R pour recommencer
        if (this.keys['KeyR']) {
            this.keys['KeyR'] = false; // Réinitialiser la touche
            location.reload();
        }
    }
    
    addParticles(x, y, color) {
        for (let i = 0; i < 10; i++) {
            this.particles.push(new Particle(x, y, color));
        }
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('lives').textContent = this.lives;
        document.getElementById('level').textContent = this.level;
        
        // Mettre à jour l'affichage du power-up
        const powerUpStatus = document.getElementById('powerUpStatus');
        if (this.player && this.player.poweredUp) {
            powerUpStatus.style.display = 'block';
            powerUpStatus.style.color = '#FFD700';
            powerUpStatus.style.fontWeight = 'bold';
            powerUpStatus.style.textShadow = '2px 2px 4px rgba(0,0,0,0.7)';
        } else {
            powerUpStatus.style.display = 'none';
        }
    }
    
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Fonctions de rendu des personnages
Game.prototype.renderSonic = function(ctx, player) {
    const centerX = player.x + player.width / 2;
    const centerY = player.y + player.height / 2;
    
    // Corps principal de Sonic (bleu cobalt plus foncé)
    ctx.fillStyle = '#1E90FF';
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, player.width/2, player.height/2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Ombre sur le corps
    ctx.fillStyle = '#0066CC';
    ctx.beginPath();
    ctx.ellipse(centerX - 2, centerY - 2, player.width/2 - 2, player.height/2 - 2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Ventre blanc (plus petit et plus haut)
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.ellipse(centerX, centerY + 5, player.width/2 - 6, player.height/2 - 8, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Yeux de Sonic (plus grands et ovales)
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.ellipse(centerX - 8, centerY - 8, 9, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(centerX + 8, centerY - 8, 9, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Pupilles noires (plus grandes)
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.ellipse(centerX - 8 + (player.direction * 3), centerY - 8, 5, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(centerX + 8 + (player.direction * 3), centerY - 8, 5, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Reflets dans les yeux
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(centerX - 6 + (player.direction * 3), centerY - 10, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(centerX + 10 + (player.direction * 3), centerY - 10, 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Oreilles (plus petites et pointues)
    ctx.fillStyle = '#1E90FF';
    ctx.beginPath();
    ctx.arc(centerX - 12, centerY - 18, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(centerX + 12, centerY - 18, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Intérieur des oreilles (rose)
    ctx.fillStyle = '#FFB6C1';
    ctx.beginPath();
    ctx.arc(centerX - 12, centerY - 18, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(centerX + 12, centerY - 18, 2.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Pics caractéristiques de Sonic (plus longs et pointus)
    ctx.fillStyle = '#1E90FF';
    ctx.beginPath();
    ctx.moveTo(centerX - 18, centerY - 25);
    ctx.lineTo(centerX - 10, centerY - 15);
    ctx.lineTo(centerX - 14, centerY - 10);
    ctx.closePath();
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(centerX + 18, centerY - 25);
    ctx.lineTo(centerX + 10, centerY - 15);
    ctx.lineTo(centerX + 14, centerY - 10);
    ctx.closePath();
    ctx.fill();
    
    // Pic central (plus long)
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - 22);
    ctx.lineTo(centerX - 4, centerY - 12);
    ctx.lineTo(centerX + 4, centerY - 12);
    ctx.closePath();
    ctx.fill();
    
    // Sourire caractéristique (plus large)
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX, centerY + 8, 10, 0, Math.PI);
    ctx.stroke();
    
    // Gants blancs (plus grands)
    ctx.fillStyle = 'white';
    ctx.fillRect(player.x - 3, player.y + player.height - 10, 10, 8);
    ctx.fillRect(player.x + player.width - 7, player.y + player.height - 10, 10, 8);
    
    // Chaussures rouges (plus grandes et caractéristiques)
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(player.x - 2, player.y + player.height - 5, 12, 5);
    ctx.fillRect(player.x + player.width - 10, player.y + player.height - 5, 12, 5);
    
    // Détails des chaussures (bande blanche)
    ctx.fillStyle = 'white';
    ctx.fillRect(player.x + 1, player.y + player.height - 4, 8, 2);
    ctx.fillRect(player.x + player.width - 9, player.y + player.height - 4, 8, 2);
    
    // Semelles des chaussures
    ctx.fillStyle = '#8B0000';
    ctx.fillRect(player.x - 2, player.y + player.height - 1, 12, 2);
    ctx.fillRect(player.x + player.width - 10, player.y + player.height - 1, 12, 2);
};

Game.prototype.renderMario = function(ctx, player) {
    const centerX = player.x + player.width / 2;
    const centerY = player.y + player.height / 2;
    
    // Corps de Mario (plus arrondi)
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.roundRect(player.x, player.y, player.width, player.height, 4);
    ctx.fill();
    
    // Salopette bleue avec boutons
    ctx.fillStyle = '#0000FF';
    ctx.beginPath();
    ctx.roundRect(player.x + 5, player.y + 15, player.width - 10, player.height - 15, 3);
    ctx.fill();
    
    // Boutons de la salopette
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(player.x + 8, player.y + 18, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(player.x + 8, player.y + 25, 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Yeux (plus expressifs)
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(player.x + 8, player.y + 8, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(player.x + 22, player.y + 8, 6, 0, Math.PI * 2);
    ctx.fill();
    
    // Pupilles avec reflets
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(player.x + 8, player.y + 8, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(player.x + 22, player.y + 8, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Reflets dans les yeux
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(player.x + 7, player.y + 6, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(player.x + 21, player.y + 6, 1, 0, Math.PI * 2);
    ctx.fill();
    
    // Moustache (plus détaillée)
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(player.x + 6, player.y + 14, 16, 4);
    ctx.fillRect(player.x + 8, player.y + 12, 12, 2);
    
    // Nez
    ctx.fillStyle = '#FFB6C1';
    ctx.beginPath();
    ctx.arc(player.x + 15, player.y + 12, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Casquette rouge avec M
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.roundRect(player.x + 2, player.y, player.width - 4, 10, 2);
    ctx.fill();
    
    // Lettre M sur la casquette
    ctx.fillStyle = 'white';
    ctx.font = 'bold 8px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('M', centerX, player.y + 7);
    
    // Visière de la casquette
    ctx.fillStyle = '#CC0000';
    ctx.fillRect(player.x + 1, player.y + 8, player.width - 2, 2);
    
    // Bras
    ctx.fillStyle = '#FFB6C1';
    ctx.fillRect(player.x - 3, player.y + 10, 6, 12);
    ctx.fillRect(player.x + player.width - 3, player.y + 10, 6, 12);
    
    // Gants blancs
    ctx.fillStyle = 'white';
    ctx.fillRect(player.x - 4, player.y + 20, 8, 6);
    ctx.fillRect(player.x + player.width - 4, player.y + 20, 8, 6);
    
    // Jambes
    ctx.fillStyle = '#0000FF';
    ctx.fillRect(player.x + 3, player.y + player.height - 8, 8, 8);
    ctx.fillRect(player.x + player.width - 11, player.y + player.height - 8, 8, 8);
    
    // Chaussures brunes
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(player.x + 2, player.y + player.height - 3, 10, 4);
    ctx.fillRect(player.x + player.width - 12, player.y + player.height - 3, 10, 4);
};

Game.prototype.renderKnuckles = function(ctx, player) {
    const centerX = player.x + player.width / 2;
    const centerY = player.y + player.height / 2;
    
    // Corps de Knuckles (plus musclé)
    ctx.fillStyle = '#8B0000';
    ctx.beginPath();
    ctx.roundRect(player.x, player.y, player.width, player.height, 4);
    ctx.fill();
    
    // Ventre blanc avec détail
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.roundRect(player.x + 5, player.y + 10, player.width - 10, player.height - 15, 3);
    ctx.fill();
    
    // Yeux (plus expressifs)
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(player.x + 8, player.y + 8, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(player.x + 22, player.y + 8, 6, 0, Math.PI * 2);
    ctx.fill();
    
    // Pupilles avec reflets
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(player.x + 8, player.y + 8, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(player.x + 22, player.y + 8, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Reflets dans les yeux
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(player.x + 7, player.y + 6, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(player.x + 21, player.y + 6, 1, 0, Math.PI * 2);
    ctx.fill();
    
    // Sourire
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, player.y + 15, 6, 0, Math.PI);
    ctx.stroke();
    
    // Dreadlocks (plus détaillées)
    ctx.fillStyle = '#8B0000';
    for (let i = 0; i < 4; i++) {
        const x = player.x + 4 + i * 6;
        ctx.fillRect(x, player.y - 8, 3, 10);
        ctx.fillRect(x + 1, player.y - 10, 1, 2);
    }
    
    // Gants avec piques
    ctx.fillStyle = 'white';
    ctx.fillRect(player.x - 2, player.y + player.height - 8, 8, 6);
    ctx.fillRect(player.x + player.width - 6, player.y + player.height - 8, 8, 6);
    
    // Piques sur les gants
    ctx.fillStyle = '#8B0000';
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(player.x + 1 + i * 2, player.y + player.height - 10);
        ctx.lineTo(player.x + 2 + i * 2, player.y + player.height - 12);
        ctx.lineTo(player.x + 3 + i * 2, player.y + player.height - 10);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(player.x + player.width - 7 + i * 2, player.y + player.height - 10);
        ctx.lineTo(player.x + player.width - 6 + i * 2, player.y + player.height - 12);
        ctx.lineTo(player.x + player.width - 5 + i * 2, player.y + player.height - 10);
        ctx.closePath();
        ctx.fill();
    }
    
    // Chaussures rouges
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(player.x - 1, player.y + player.height - 3, 10, 4);
    ctx.fillRect(player.x + player.width - 9, player.y + player.height - 3, 10, 4);
    
    // Détails des chaussures
    ctx.fillStyle = '#CC0000';
    ctx.fillRect(player.x + 1, player.y + player.height - 2, 6, 2);
    ctx.fillRect(player.x + player.width - 7, player.y + player.height - 2, 6, 2);
};

Game.prototype.renderCaptainBarnacles = function(ctx, player) {
    const centerX = player.x + player.width / 2;
    const centerY = player.y + player.height / 2;
    
    // Corps de Captain Barnacles (ours polaire blanc)
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(player.x, player.y, player.width, player.height, 6);
    ctx.fill();
    
    // Ombre sur le corps
    ctx.fillStyle = '#F0F0F0';
    ctx.beginPath();
    ctx.roundRect(player.x + 2, player.y + 2, player.width - 4, player.height - 4, 4);
    ctx.fill();
    
    // Uniforme bleu des Octonauts
    ctx.fillStyle = '#0000FF';
    ctx.beginPath();
    ctx.roundRect(player.x + 4, player.y + 8, player.width - 8, player.height - 12, 3);
    ctx.fill();
    
    // Yeux de l'ours polaire
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(player.x + 8, player.y + 8, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(player.x + 22, player.y + 8, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Museau de l'ours
    ctx.fillStyle = '#F0F0F0';
    ctx.beginPath();
    ctx.arc(centerX, player.y + 12, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Nez noir
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(centerX, player.y + 12, 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Oreilles d'ours
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(player.x + 6, player.y + 6, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(player.x + 24, player.y + 6, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Intérieur des oreilles
    ctx.fillStyle = '#F0F0F0';
    ctx.beginPath();
    ctx.arc(player.x + 6, player.y + 6, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(player.x + 24, player.y + 6, 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Sourire
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, player.y + 16, 6, 0, Math.PI);
    ctx.stroke();
    
    // Insigne de capitaine
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(player.x + 8, player.y + 10, 6, 4);
    
    // Détails de l'uniforme
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(player.x + 6, player.y + 18, player.width - 12, 2);
    
    // Bras
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(player.x - 3, player.y + 10, 6, 12);
    ctx.fillRect(player.x + player.width - 3, player.y + 10, 6, 12);
    
    // Gants bleus
    ctx.fillStyle = '#0000FF';
    ctx.fillRect(player.x - 4, player.y + 20, 8, 6);
    ctx.fillRect(player.x + player.width - 4, player.y + 20, 8, 6);
    
    // Jambes
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(player.x + 6, player.y + player.height - 10, 6, 10);
    ctx.fillRect(player.x + player.width - 12, player.y + player.height - 10, 6, 10);
    
    // Bottes bleues
    ctx.fillStyle = '#0000FF';
    ctx.fillRect(player.x + 4, player.y + player.height - 4, 10, 4);
    ctx.fillRect(player.x + player.width - 14, player.y + player.height - 4, 10, 4);
    
    // Détails des bottes
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(player.x + 6, player.y + player.height - 3, 2, 1);
    ctx.fillRect(player.x + player.width - 8, player.y + player.height - 3, 2, 1);
};

Game.prototype.renderKwazii = function(ctx, player) {
    const centerX = player.x + player.width / 2;
    const centerY = player.y + player.height / 2;
    
    // Corps de Kwazii (chat orange)
    ctx.fillStyle = '#FF8C00';
    ctx.beginPath();
    ctx.roundRect(player.x, player.y, player.width, player.height, 6);
    ctx.fill();
    
    // Ombre sur le corps
    ctx.fillStyle = '#FF7F00';
    ctx.beginPath();
    ctx.roundRect(player.x + 2, player.y + 2, player.width - 4, player.height - 4, 4);
    ctx.fill();
    
    // Uniforme bleu des Octonauts
    ctx.fillStyle = '#0000FF';
    ctx.beginPath();
    ctx.roundRect(player.x + 4, player.y + 8, player.width - 8, player.height - 12, 3);
    ctx.fill();
    
    // Yeux de chat (plus expressifs)
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(player.x + 8, player.y + 8, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(player.x + 22, player.y + 8, 6, 0, Math.PI * 2);
    ctx.fill();
    
    // Pupilles de chat (verticales)
    ctx.fillStyle = 'black';
    ctx.fillRect(player.x + 6, player.y + 6, 4, 8);
    ctx.fillRect(player.x + 20, player.y + 6, 4, 8);
    
    // Reflets dans les yeux
    ctx.fillStyle = 'white';
    ctx.fillRect(player.x + 7, player.y + 7, 2, 2);
    ctx.fillRect(player.x + 21, player.y + 7, 2, 2);
    
    // Museau de chat
    ctx.fillStyle = '#FF8C00';
    ctx.beginPath();
    ctx.arc(centerX, player.y + 12, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Nez rose
    ctx.fillStyle = '#FFB6C1';
    ctx.beginPath();
    ctx.arc(centerX, player.y + 12, 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Oreilles de chat
    ctx.fillStyle = '#FF8C00';
    ctx.beginPath();
    ctx.moveTo(player.x + 6, player.y + 4);
    ctx.lineTo(player.x + 4, player.y + 8);
    ctx.lineTo(player.x + 8, player.y + 8);
    ctx.closePath();
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(player.x + 24, player.y + 4);
    ctx.lineTo(player.x + 22, player.y + 8);
    ctx.lineTo(player.x + 26, player.y + 8);
    ctx.closePath();
    ctx.fill();
    
    // Intérieur des oreilles
    ctx.fillStyle = '#FFB6C1';
    ctx.beginPath();
    ctx.moveTo(player.x + 6, player.y + 5);
    ctx.lineTo(player.x + 5, player.y + 7);
    ctx.lineTo(player.x + 7, player.y + 7);
    ctx.closePath();
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(player.x + 24, player.y + 5);
    ctx.lineTo(player.x + 23, player.y + 7);
    ctx.lineTo(player.x + 25, player.y + 7);
    ctx.closePath();
    ctx.fill();
    
    // Sourire de chat
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, player.y + 16, 6, 0, Math.PI);
    ctx.stroke();
    
    // Moustaches de chat
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(player.x + 4 + i * 2, player.y + 14);
        ctx.lineTo(player.x + 2 + i * 2, player.y + 14);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(player.x + 20 + i * 2, player.y + 14);
        ctx.lineTo(player.x + 22 + i * 2, player.y + 14);
        ctx.stroke();
    }
    
    // Insigne de lieutenant
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(player.x + 8, player.y + 10, 6, 4);
    
    // Détails de l'uniforme
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(player.x + 6, player.y + 18, player.width - 12, 2);
    
    // Bras
    ctx.fillStyle = '#FF8C00';
    ctx.fillRect(player.x - 3, player.y + 10, 6, 12);
    ctx.fillRect(player.x + player.width - 3, player.y + 10, 6, 12);
    
    // Gants bleus
    ctx.fillStyle = '#0000FF';
    ctx.fillRect(player.x - 4, player.y + 20, 8, 6);
    ctx.fillRect(player.x + player.width - 4, player.y + 20, 8, 6);
    
    // Jambes
    ctx.fillStyle = '#FF8C00';
    ctx.fillRect(player.x + 6, player.y + player.height - 10, 6, 10);
    ctx.fillRect(player.x + player.width - 12, player.y + player.height - 10, 6, 10);
    
    // Bottes bleues
    ctx.fillStyle = '#0000FF';
    ctx.fillRect(player.x + 4, player.y + player.height - 4, 10, 4);
    ctx.fillRect(player.x + player.width - 14, player.y + player.height - 4, 10, 4);
    
    // Détails des bottes
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(player.x + 6, player.y + player.height - 3, 2, 1);
    ctx.fillRect(player.x + player.width - 8, player.y + player.height - 3, 2, 1);
};

Game.prototype.renderNinjago = function(ctx, player) {
    const centerX = player.x + player.width / 2;
    const centerY = player.y + player.height / 2;
    
    // Corps du ninja vert (Lloyd Garmadon)
    ctx.fillStyle = '#32CD32';
    ctx.beginPath();
    ctx.roundRect(player.x, player.y, player.width, player.height, 4);
    ctx.fill();
    
    // Ombre sur le corps
    ctx.fillStyle = '#228B22';
    ctx.beginPath();
    ctx.roundRect(player.x + 2, player.y + 2, player.width - 4, player.height - 4, 3);
    ctx.fill();
    
    // Capuche de ninja (plus détaillée)
    ctx.fillStyle = '#228B22';
    ctx.beginPath();
    ctx.roundRect(player.x + 3, player.y + 3, player.width - 6, 18, 2);
    ctx.fill();
    
    // Yeux brillants (caractéristiques de Lloyd)
    ctx.fillStyle = '#00FF00';
    ctx.beginPath();
    ctx.arc(player.x + 10, player.y + 10, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(player.x + 20, player.y + 10, 7, 0, Math.PI * 2);
    ctx.fill();
    
    // Pupilles avec reflets
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(player.x + 10, player.y + 10, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(player.x + 20, player.y + 10, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Reflets brillants dans les yeux
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(player.x + 9, player.y + 8, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(player.x + 19, player.y + 8, 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Sourire sous le masque
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, player.y + 18, 6, 0, Math.PI);
    ctx.stroke();
    
    // Ceinture de ninja avec détails dorés
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(player.x + 4, player.y + 18, player.width - 8, 5);
    
    // Boucle de ceinture dorée
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(player.x + 12, player.y + 19, 6, 3);
    
    // Épée de ninja (à la ceinture)
    ctx.fillStyle = '#C0C0C0';
    ctx.fillRect(player.x + 8, player.y + 20, 2, 10);
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(player.x + 7, player.y + 30, 4, 3);
    
    // Bras musclés
    ctx.fillStyle = '#32CD32';
    ctx.fillRect(player.x - 4, player.y + 8, 8, 14);
    ctx.fillRect(player.x + player.width - 4, player.y + 8, 8, 14);
    
    // Gants de ninja noirs
    ctx.fillStyle = '#000000';
    ctx.fillRect(player.x - 5, player.y + 20, 10, 6);
    ctx.fillRect(player.x + player.width - 5, player.y + 20, 10, 6);
    
    // Détails des gants (lignes dorées)
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(player.x - 3, player.y + 22 + i * 2);
        ctx.lineTo(player.x + 3, player.y + 22 + i * 2);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(player.x + player.width - 3, player.y + 22 + i * 2);
        ctx.lineTo(player.x + player.width + 3, player.y + 22 + i * 2);
        ctx.stroke();
    }
    
    // Jambes
    ctx.fillStyle = '#32CD32';
    ctx.fillRect(player.x + 4, player.y + player.height - 12, 8, 12);
    ctx.fillRect(player.x + player.width - 12, player.y + player.height - 12, 8, 12);
    
    // Chaussures de ninja noires
    ctx.fillStyle = '#000000';
    ctx.fillRect(player.x + 2, player.y + player.height - 5, 12, 5);
    ctx.fillRect(player.x + player.width - 14, player.y + player.height - 5, 12, 5);
    
    // Détails des chaussures (lignes dorées)
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(player.x + 4, player.y + player.height - 3);
    ctx.lineTo(player.x + 8, player.y + player.height - 3);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(player.x + player.width - 8, player.y + player.height - 3);
    ctx.lineTo(player.x + player.width - 4, player.y + player.height - 3);
    ctx.stroke();
    
    // Énergie verte (caractéristique de Lloyd)
    ctx.fillStyle = '#00FF00';
    ctx.globalAlpha = 0.6;
    for (let i = 0; i < 3; i++) {
        const angle = (player.animation * 2 + i * 2) % (Math.PI * 2);
        const radius = 25;
        const px = centerX + Math.cos(angle) * radius;
        const py = centerY + Math.sin(angle) * radius;
        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
};

Game.prototype.renderSpongebob = function(ctx, player) {
    const centerX = player.x + player.width / 2;
    const centerY = player.y + player.height / 2;
    
    // Corps de Bob l'éponge (carré avec texture d'éponge)
    ctx.fillStyle = '#FFFF00';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Bordure de l'éponge
    ctx.strokeStyle = '#E6E600';
    ctx.lineWidth = 2;
    ctx.strokeRect(player.x, player.y, player.width, player.height);
    
    // Trous d'éponge (plus nombreux et variés)
    ctx.fillStyle = '#F0E68C';
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            const size = 1.5 + Math.random() * 1;
            ctx.beginPath();
            ctx.arc(player.x + 6 + i * 6, player.y + 6 + j * 6, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // Yeux (plus expressifs et ronds)
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(player.x + 8, player.y + 8, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(player.x + 22, player.y + 8, 7, 0, Math.PI * 2);
    ctx.fill();
    
    // Pupilles (plus grandes)
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(player.x + 8, player.y + 8, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(player.x + 22, player.y + 8, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Reflets dans les yeux
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(player.x + 7, player.y + 6, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(player.x + 21, player.y + 6, 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Cils
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
    ctx.beginPath();
        ctx.moveTo(player.x + 5 + i * 2, player.y + 2);
        ctx.lineTo(player.x + 6 + i * 2, player.y - 2);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(player.x + 19 + i * 2, player.y + 2);
        ctx.lineTo(player.x + 20 + i * 2, player.y - 2);
        ctx.stroke();
    }
    
    // Nez
    ctx.fillStyle = '#FFB6C1';
    ctx.beginPath();
    ctx.arc(centerX, player.y + 12, 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Sourire (plus expressif)
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX, player.y + 18, 10, 0, Math.PI);
    ctx.stroke();
    
    // Dents
    ctx.fillStyle = 'white';
    for (let i = 0; i < 4; i++) {
        ctx.fillRect(centerX - 6 + i * 3, player.y + 18, 2, 4);
    }
    
    // Chemise blanche
    ctx.fillStyle = 'white';
    ctx.fillRect(player.x + 2, player.y + 22, player.width - 4, 8);
    
    // Cravate rouge
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(centerX - 1, player.y + 22, 2, 8);
    
    // Pantalon brun
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(player.x + 3, player.y + player.height - 6, player.width - 6, 6);
    
    // Chaussures noires
    ctx.fillStyle = 'black';
    ctx.fillRect(player.x + 2, player.y + player.height - 3, 8, 3);
    ctx.fillRect(player.x + player.width - 10, player.y + player.height - 3, 8, 3);
    
    // Lacets
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(player.x + 4, player.y + player.height - 2);
    ctx.lineTo(player.x + 6, player.y + player.height - 1);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(player.x + player.width - 8, player.y + player.height - 2);
    ctx.lineTo(player.x + player.width - 6, player.y + player.height - 1);
    ctx.stroke();
};

Game.prototype.renderBlippi = function(ctx, player) {
    const centerX = player.x + player.width / 2;
    const centerY = player.y + player.height / 2;
    
    // Corps de Blippi (orange vif)
    ctx.fillStyle = '#FF8C00';
    ctx.beginPath();
    ctx.roundRect(player.x, player.y, player.width, player.height, 4);
    ctx.fill();
    
    // Ombre sur le corps
    ctx.fillStyle = '#FF7F00';
    ctx.beginPath();
    ctx.roundRect(player.x + 2, player.y + 2, player.width - 4, player.height - 4, 3);
    ctx.fill();
    
    // Chemise bleue (plus large)
    ctx.fillStyle = '#0000FF';
    ctx.beginPath();
    ctx.roundRect(player.x + 3, player.y + 8, player.width - 6, player.height - 12, 3);
    ctx.fill();
    
    // Bretelles orange (caractéristiques de Blippi)
    ctx.fillStyle = '#FF8C00';
    ctx.fillRect(player.x + 5, player.y + 10, player.width - 10, 3);
    ctx.fillRect(player.x + 5, player.y + 15, player.width - 10, 3);
    
    // Boutons de la chemise
    ctx.fillStyle = '#FFD700';
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(player.x + 8, player.y + 12 + i * 6, 1.5, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Yeux (plus expressifs et ronds)
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(player.x + 8, player.y + 8, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(player.x + 22, player.y + 8, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // Pupilles avec reflets
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(player.x + 8, player.y + 8, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(player.x + 22, player.y + 8, 5, 0, Math.PI * 2);
    ctx.fill();
    
    // Reflets dans les yeux
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(player.x + 7, player.y + 6, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(player.x + 21, player.y + 6, 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Lunettes (plus grandes et rondes)
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(player.x + 8, player.y + 8, 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(player.x + 22, player.y + 8, 10, 0, Math.PI * 2);
    ctx.stroke();
    
    // Pont des lunettes
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(player.x + 18, player.y + 8);
    ctx.lineTo(player.x + 20, player.y + 8);
    ctx.stroke();
    
    // Branches des lunettes
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(player.x + 2, player.y + 8);
    ctx.lineTo(player.x - 2, player.y + 8);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(player.x + 28, player.y + 8);
    ctx.lineTo(player.x + 32, player.y + 8);
    ctx.stroke();
    
    // Sourire (très large et expressif)
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(centerX, player.y + 22, 12, 0, Math.PI);
    ctx.stroke();
    
    // Dents (plus nombreuses)
    ctx.fillStyle = 'white';
    for (let i = 0; i < 6; i++) {
        ctx.fillRect(centerX - 9 + i * 3, player.y + 22, 2, 5);
    }
    
    // Bras
    ctx.fillStyle = '#FF8C00';
    ctx.fillRect(player.x - 3, player.y + 10, 6, 12);
    ctx.fillRect(player.x + player.width - 3, player.y + 10, 6, 12);
    
    // Gants orange (caractéristiques)
    ctx.fillStyle = '#FF8C00';
    ctx.fillRect(player.x - 4, player.y + 20, 8, 6);
    ctx.fillRect(player.x + player.width - 4, player.y + 20, 8, 6);
    
    // Jambes
    ctx.fillStyle = '#0000FF';
    ctx.fillRect(player.x + 4, player.y + player.height - 10, 8, 10);
    ctx.fillRect(player.x + player.width - 12, player.y + player.height - 10, 8, 10);
    
    // Chaussures noires (caractéristiques de Blippi)
    ctx.fillStyle = '#000000';
    ctx.fillRect(player.x + 2, player.y + player.height - 4, 12, 4);
    ctx.fillRect(player.x + player.width - 14, player.y + player.height - 4, 12, 4);
    
    // Lacets blancs
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(player.x + 4, player.y + player.height - 2);
    ctx.lineTo(player.x + 6, player.y + player.height - 1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(player.x + player.width - 8, player.y + player.height - 2);
    ctx.lineTo(player.x + player.width - 6, player.y + player.height - 1);
    ctx.stroke();
    
    // Chaussettes blanches
    ctx.fillStyle = 'white';
    ctx.fillRect(player.x + 3, player.y + player.height - 8, 10, 4);
    ctx.fillRect(player.x + player.width - 13, player.y + player.height - 8, 10, 4);
    
    // Casquette orange (caractéristique de Blippi)
    ctx.fillStyle = '#FF8C00';
    ctx.fillRect(player.x + 2, player.y - 5, player.width - 4, 8);
    
    // Visière de la casquette
    ctx.fillStyle = '#000000';
    ctx.fillRect(player.x + 1, player.y + 1, player.width - 2, 2);
};

// Classe du joueur (Sonic)
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 45; // Plus grand pour la nouvelle résolution
        this.height = 45;
        this.velocityX = 0;
        this.velocityY = 0;
        this.speed = 8; // Plus rapide pour la nouvelle résolution
        this.jumpPower = 22; // Saut plus puissant pour la nouvelle résolution
        this.onGround = false;
        this.color = '#00BFFF'; // Bleu Sonic
        this.direction = 1; // 1 = droite, -1 = gauche
        this.animation = 0;
        
        // Système de power-ups
        this.poweredUp = false;
        this.powerUpType = null;
        this.originalWidth = this.width;
        this.originalHeight = this.height;
        this.originalSpeed = this.speed;
        this.originalJumpPower = this.jumpPower;
    }
    
    update(keys, platforms) {
        // Mouvement horizontal
        if (keys['ArrowLeft']) {
            this.velocityX = -this.speed;
            this.direction = -1;
        } else if (keys['ArrowRight']) {
            this.velocityX = this.speed;
            this.direction = 1;
        } else {
            this.velocityX *= 0.7; // Friction réduite pour plus de fluidité
        }
        
        // Saut
        if (keys['Space'] && this.onGround) {
            this.velocityY = -this.jumpPower;
            this.onGround = false;
            // Jouer le son de saut (sera appelé depuis la classe Game)
            if (window.gameInstance) {
                window.gameInstance.playSound('jump');
            }
        }
        
        // Gravité réduite pour des sauts plus longs
        this.velocityY += 0.6;
        
        // Animation
        this.animation += 0.3;
        
        // Appliquer la vélocité
        this.x += this.velocityX;
        this.y += this.velocityY;
        
        // Vérifier les collisions avec les plateformes
        this.onGround = false;
        platforms.forEach(platform => {
            if (this.checkCollision(platform)) {
                // Collision par le haut
                if (this.velocityY > 0 && this.y < platform.y) {
                    this.y = platform.y - this.height;
                    this.velocityY = 0;
                    this.onGround = true;
                }
                // Collision par le bas
                else if (this.velocityY < 0 && this.y > platform.y) {
                    this.y = platform.y + platform.height;
                    this.velocityY = 0;
                }
                // Collision latérale
                else if (this.velocityX > 0) {
                    this.x = platform.x - this.width;
                } else if (this.velocityX < 0) {
                    this.x = platform.x + platform.width;
                }
            }
        });
        
        // Limiter la position (maintenant dans le monde étendu)
        this.x = Math.max(0, Math.min(this.x, 6000 - this.width));
    }
    
    checkCollision(platform) {
        return this.x < platform.x + platform.width &&
               this.x + this.width > platform.x &&
               this.y < platform.y + platform.height &&
               this.y + this.height > platform.y;
    }
    
    render(ctx) {
        // Utiliser la fonction de rendu du personnage sélectionné
        if (window.gameInstance && window.gameInstance.availableCharacters[window.gameInstance.selectedCharacter]) {
            const character = window.gameInstance.availableCharacters[window.gameInstance.selectedCharacter];
            character.render(ctx, this);
        } else {
            // Rendu par défaut (Sonic)
            this.renderSonic(ctx);
        }
        
        // Effet de vitesse (lignes derrière le personnage quand il court)
        if (Math.abs(this.velocityX) > 2) {
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.6;
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.moveTo(this.x - 10 - i * 8, this.y + 5 + i * 3);
                ctx.lineTo(this.x - 5 - i * 8, this.y + 8 + i * 3);
                ctx.stroke();
            }
            ctx.globalAlpha = 1;
        }
        
        // Indicateur de power-up
        if (this.poweredUp) {
            // Bordure dorée autour du personnage
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 3;
            ctx.strokeRect(this.x - 2, this.y - 2, this.width + 4, this.height + 4);
            
            // Effet de particules dorées
            ctx.fillStyle = '#FFD700';
            ctx.globalAlpha = 0.7;
            for (let i = 0; i < 5; i++) {
                const angle = (this.animation * 2 + i * 1.2) % (Math.PI * 2);
                const radius = 20;
                const px = this.x + this.width/2 + Math.cos(angle) * radius;
                const py = this.y + this.height/2 + Math.sin(angle) * radius;
                ctx.beginPath();
                ctx.arc(px, py, 2, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        }
    }
    
    renderSonic(ctx) {
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        
        // Corps principal de Sonic (ovale)
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, this.width/2, this.height/2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Ventre blanc
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.ellipse(centerX, centerY + 3, this.width/2 - 4, this.height/2 - 6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Yeux de Sonic
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(centerX - 6, centerY - 5, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(centerX + 6, centerY - 5, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // Pupilles noires
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(centerX - 6 + (this.direction * 2), centerY - 5, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(centerX + 6 + (this.direction * 2), centerY - 5, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Oreilles
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(centerX - 8, centerY - 12, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(centerX + 8, centerY - 12, 4, 0, Math.PI * 2);
        ctx.fill();
    }
    
    powerUp(type) {
        this.poweredUp = true;
        this.powerUpType = type;
        
        if (type === 'mushroom') {
            // Agrandir le personnage
            this.width = this.originalWidth * 1.5;
            this.height = this.originalHeight * 1.5;
            this.speed = this.originalSpeed * 1.2; // Légèrement plus rapide
            this.jumpPower = this.originalJumpPower * 1.1; // Saut légèrement plus puissant
            
            // Ajouter une vie supplémentaire
            if (window.gameInstance) {
                window.gameInstance.lives += 1;
                window.gameInstance.updateUI();
            }
        }
        
        // Le power-up dure 30 secondes
        setTimeout(() => {
            this.removePowerUp();
        }, 30000);
    }
    
    removePowerUp() {
        this.poweredUp = false;
        this.powerUpType = null;
        
        // Restaurer la taille originale
        this.width = this.originalWidth;
        this.height = this.originalHeight;
        this.speed = this.originalSpeed;
        this.jumpPower = this.originalJumpPower;
    }
    
    // Méthode pour vérifier si le joueur est touché (avec protection si powered up)
    takeDamage() {
        if (this.poweredUp) {
            // Si powered up, perdre le power-up au lieu d'une vie
            this.removePowerUp();
            return false; // Pas de perte de vie
        } else {
            // Si pas powered up, perdre une vie normalement
            return true; // Perte de vie
        }
    }
}

// Classe des plateformes
class Platform {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = '#8B4513';
    }
    
    update() {
        // Les plateformes statiques n'ont rien à mettre à jour
    }
    
    render(ctx) {
        // Obtenir les couleurs du thème actuel
        const levelInfo = window.gameInstance ? window.gameInstance.levelData[window.gameInstance.level] : null;
        let platformColor = this.color;
        let borderColor = '#654321';
        let textureColor = '#A0522D';
        
        if (levelInfo) {
            platformColor = levelInfo.platformColor;
            if (levelInfo.theme === 'ice') {
                borderColor = '#B0C4DE';
                textureColor = '#E0E0E0';
            } else if (levelInfo.theme === 'beach') {
                borderColor = '#D2B48C';
                textureColor = '#F5DEB3';
            } else if (levelInfo.theme === 'fire') {
                borderColor = '#8B0000';
                textureColor = '#CD853F';
            } else if (levelInfo.theme === 'water') {
                borderColor = '#2F4F4F';
                textureColor = '#5F9EA0';
            }
        }
        
        // Plateforme principale
        ctx.fillStyle = platformColor;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Bordure
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        // Texture
        ctx.fillStyle = textureColor;
        for (let i = 0; i < this.width; i += 20) {
            ctx.fillRect(this.x + i, this.y, 2, this.height);
        }
    }
}

// Classe des plateformes mobiles
class MovingPlatform extends Platform {
    constructor(x, y, width, height, direction = 'vertical') {
        super(x, y, width, height);
        this.direction = direction;
        this.originalY = y;
        this.originalX = x;
        this.speed = 1;
        this.range = 100; // Distance de mouvement
        this.time = 0;
        this.color = '#4A90E2'; // Bleu pour les distinguer
    }
    
    update() {
        this.time += 0.02;
        
        if (this.direction === 'vertical') {
            this.y = this.originalY + Math.sin(this.time) * this.range;
        } else if (this.direction === 'horizontal') {
            this.x = this.originalX + Math.sin(this.time) * this.range;
        }
    }
    
    render(ctx) {
        // Plateforme mobile principale
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Bordure
        ctx.strokeStyle = '#2E5B8A';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        // Texture avec effet de mouvement
        ctx.fillStyle = '#6BB6FF';
        for (let i = 0; i < this.width; i += 20) {
            ctx.fillRect(this.x + i, this.y, 2, this.height);
        }
        
        // Indicateur de mouvement (flèches)
        ctx.fillStyle = '#FFD700';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('↕', this.x + this.width/2, this.y + this.height/2 + 4);
    }
}

// Classe des ennemis
class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 38;
        this.height = 38;
        this.velocityX = -1.5;
        this.velocityY = 0;
        this.color = '#8B0000';
    }
    
    update(platforms) {
        // Gravité
        this.velocityY += 0.8;
        
        // Appliquer la vélocité
        this.x += this.velocityX;
        this.y += this.velocityY;
        
        // Vérifier les collisions avec les plateformes
        platforms.forEach(platform => {
            if (this.checkCollision(platform)) {
                if (this.velocityY > 0 && this.y < platform.y) {
                    this.y = platform.y - this.height;
                    this.velocityY = 0;
                }
            }
        });
        
        // Changer de direction aux bords du monde
        if (this.x <= 0 || this.x >= 6000 - this.width) {
            this.velocityX *= -1;
        }
    }
    
    checkCollision(platform) {
        return this.x < platform.x + platform.width &&
               this.x + this.width > platform.x &&
               this.y < platform.y + platform.height &&
               this.y + this.height > platform.y;
    }
    
    render(ctx) {
        // Corps de l'ennemi
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Yeux rouges
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x + 5, this.y + 5, 6, 6);
        ctx.fillRect(this.x + 14, this.y + 5, 6, 6);
    }
}

// Classe des collectibles
class Collectible {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.color = '#FFD700';
        this.animation = 0;
    }
    
    update() {
        this.animation += 0.2;
    }
    
    render(ctx) {
        const bounce = Math.sin(this.animation) * 3;
        
        // Collectible doré
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x + this.width/2, this.y + this.height/2 + bounce, this.width/2, 0, Math.PI * 2);
        ctx.fill();
        
        // Reflet
        ctx.fillStyle = '#FFA500';
        ctx.beginPath();
        ctx.arc(this.x + this.width/2 - 3, this.y + this.height/2 + bounce - 3, 3, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Classe des particules
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.velocityX = (Math.random() - 0.5) * 10;
        this.velocityY = (Math.random() - 0.5) * 10;
        this.color = color;
        this.life = 30;
        this.maxLife = 30;
    }
    
    update() {
        this.x += this.velocityX;
        this.y += this.velocityY;
        this.velocityY += 0.5; // Gravité
        this.life--;
    }
    
    render(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, 4, 4);
        ctx.globalAlpha = 1;
    }
}

// Classe des nuages
class Cloud {
    constructor(x, y, scale = 1) {
        this.x = x;
        this.y = y;
        this.scale = scale;
        this.animation = Math.random() * Math.PI * 2;
        this.speed = 0.2 + Math.random() * 0.3;
    }
    
    update() {
        this.animation += 0.01;
        this.x += this.speed;
        
        // Faire boucler les nuages
        if (this.x > 6000) {
            this.x = -100;
        }
    }
    
    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(this.scale, this.scale);
        
        // Nuage principal
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(15, 0, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-15, 0, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, -10, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(10, -5, 10, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

// Classe des montagnes
class Mountain {
    constructor(x, y, scale = 1) {
        this.x = x;
        this.y = y;
        this.scale = scale;
        this.height = 80 + Math.random() * 40;
    }
    
    update() {
        // Les montagnes ne bougent pas
    }
    
    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(this.scale, this.scale);
        
        // Montagne principale
        ctx.fillStyle = '#8B7355';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(50, -this.height);
        ctx.lineTo(100, 0);
        ctx.closePath();
        ctx.fill();
        
        // Pic de la montagne
        ctx.fillStyle = '#A0522D';
        ctx.beginPath();
        ctx.moveTo(40, -this.height);
        ctx.lineTo(50, -this.height - 20);
        ctx.lineTo(60, -this.height);
        ctx.closePath();
        ctx.fill();
        
        // Neige sur le pic
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.moveTo(45, -this.height - 15);
        ctx.lineTo(50, -this.height - 20);
        ctx.lineTo(55, -this.height - 15);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
}

// Classe des arbres
class Tree {
    constructor(x, y, scale = 1) {
        this.x = x;
        this.y = y;
        this.scale = scale;
        this.animation = Math.random() * Math.PI * 2;
        this.windOffset = Math.random() * 0.1;
    }
    
    update() {
        this.animation += 0.02 + this.windOffset;
    }
    
    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(this.scale, this.scale);
        
        const wind = Math.sin(this.animation) * 2;
        
        // Tronc de l'arbre
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-3 + wind, -30, 6, 30);
        
        // Feuillage
        ctx.fillStyle = '#228B22';
        ctx.beginPath();
        ctx.arc(0 + wind, -35, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-8 + wind, -25, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(8 + wind, -25, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0 + wind, -15, 10, 0, Math.PI * 2);
        ctx.fill();
        
        // Détails sur le tronc
        ctx.fillStyle = '#654321';
        ctx.fillRect(-2 + wind, -20, 2, 15);
        ctx.fillRect(1 + wind, -25, 1, 10);
        
        ctx.restore();
    }
}

// Classe des buissons
class Bush {
    constructor(x, y, scale = 1) {
        this.x = x;
        this.y = y;
        this.scale = scale;
        this.animation = Math.random() * Math.PI * 2;
        this.windOffset = Math.random() * 0.05;
    }
    
    update() {
        this.animation += 0.01 + this.windOffset;
    }
    
    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(this.scale, this.scale);
        
        const wind = Math.sin(this.animation) * 1;
        
        // Buisson principal
        ctx.fillStyle = '#228B22';
        ctx.beginPath();
        ctx.arc(0 + wind, -8, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-6 + wind, -5, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(6 + wind, -5, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0 + wind, 0, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // Détails
        ctx.fillStyle = '#32CD32';
        ctx.beginPath();
        ctx.arc(-3 + wind, -6, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(3 + wind, -6, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

// Classe des fleurs
class Flower {
    constructor(x, y, scale = 1) {
        this.x = x;
        this.y = y;
        this.scale = scale;
        this.animation = Math.random() * Math.PI * 2;
        this.windOffset = Math.random() * 0.08;
        this.colors = ['#FF69B4', '#FFB6C1', '#FFA500', '#FFD700', '#98FB98', '#87CEEB'];
        this.color = this.colors[Math.floor(Math.random() * this.colors.length)];
    }
    
    update() {
        this.animation += 0.02 + this.windOffset;
    }
    
    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(this.scale, this.scale);
        
        const wind = Math.sin(this.animation) * 0.5;
        
        // Tige
        ctx.strokeStyle = '#228B22';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0 + wind, -8);
        ctx.stroke();
        
        // Fleur
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0 + wind, -8, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Pétales
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.8;
        for (let i = 0; i < 5; i++) {
            const angle = (i * Math.PI * 2) / 5;
            const px = Math.cos(angle) * 2 + wind;
            const py = Math.sin(angle) * 2 - 8;
            ctx.beginPath();
            ctx.arc(px, py, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        
        // Centre de la fleur
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(0 + wind, -8, 1, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

// Classe du ressort
class Spring {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 15;
        this.animation = 0;
        this.activated = false;
        this.activationTime = 0;
    }
    
    update() {
        this.animation += 0.1;
        if (this.activated) {
            this.activationTime += 0.1;
            if (this.activationTime > 0.5) {
                this.activated = false;
                this.activationTime = 0;
            }
        }
    }
    
    activate() {
        this.activated = true;
        this.activationTime = 0;
    }
    
    render(ctx) {
        const bounce = this.activated ? Math.sin(this.activationTime * 20) * 3 : 0;
        
        // Base du ressort
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(this.x, this.y + bounce, this.width, this.height);
        
        // Spires du ressort
        ctx.strokeStyle = '#FFA500';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < 3; i++) {
            const y = this.y + bounce + 3 + i * 4;
            ctx.moveTo(this.x + 2, y);
            ctx.lineTo(this.x + this.width - 2, y);
        }
        ctx.stroke();
        
        // Indicateur de ressort
        ctx.fillStyle = '#FF8C00';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('↕', this.x + this.width/2, this.y + bounce + this.height/2 + 4);
    }
}

// Classe du champignon
class Mushroom {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 25;
        this.animation = 0;
        this.bounce = 0;
    }
    
    update() {
        this.animation += 0.1;
        this.bounce = Math.sin(this.animation) * 2;
    }
    
    render(ctx) {
        const bounceY = this.y + this.bounce;
        
        // Tige du champignon
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.x + 8, bounceY + 15, 4, 10);
        
        // Chapeau du champignon
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.ellipse(this.x + 10, bounceY + 10, 10, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Taches blanches sur le chapeau
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.x + 6, bounceY + 6, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + 12, bounceY + 8, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + 14, bounceY + 4, 1, 0, Math.PI * 2);
        ctx.fill();
        
        // Bordure du chapeau
        ctx.strokeStyle = '#8B0000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(this.x + 10, bounceY + 10, 10, 8, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // Indicateur de power-up
        ctx.fillStyle = '#FFD700';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🍄', this.x + 10, bounceY + 5);
    }
}

// Classe du drapeau
class Flag {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 80;
        this.flagWidth = 40;
        this.flagHeight = 30;
        this.animation = 0;
    }
    
    update() {
        this.animation += 0.1;
    }
    
    render(ctx) {
        // Mât du drapeau
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Drapeau qui flotte
        const wave = Math.sin(this.animation) * 3;
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(this.x + this.width, this.y + 10 + wave, this.flagWidth, this.flagHeight);
        
        // Bordure du drapeau
        ctx.strokeStyle = '#8B0000';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x + this.width, this.y + 10 + wave, this.flagWidth, this.flagHeight);
        
        // Croix blanche sur le drapeau
        ctx.fillStyle = 'white';
        ctx.fillRect(this.x + this.width + 5, this.y + 15 + wave, 30, 4);
        ctx.fillRect(this.x + this.width + 15, this.y + 10 + wave, 4, 20);
    }
}

// Démarrer le jeu
window.addEventListener('load', () => {
    window.gameInstance = new Game();
    
    // Initialiser les prévisualisations des personnages après le chargement complet
    setTimeout(() => {
        window.gameInstance.setupCharacterPreviews();
    }, 100);
});



