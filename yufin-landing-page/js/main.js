/**
 * YüFin - Sistema Principal de Interatividade
 * Arquivo modular para melhor manutenção
 */

// ===== CONFIGURAÇÕES GERAIS =====
const CONFIG = {
    animationDuration: 400,
    scrollOffset: 60, // Ajustado para melhor posicionamento da seção
    faqMaxHeight: '300px'
};

// ===== UTILITÁRIOS =====
const Utils = {
    // Easing function para animações suaves
    easeInOutCubic: function(t) {
        return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    },

    // Smooth scroll para elementos
    smoothScrollTo: function(element, offset = CONFIG.scrollOffset) {
        const targetPosition = element.offsetTop - offset;
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
        const duration = Math.min(Math.abs(distance) / 2, 1000);
        let start = null;

        function animation(currentTime) {
            if (start === null) start = currentTime;
            const timeElapsed = currentTime - start;
            const progress = Math.min(timeElapsed / duration, 1);
            const ease = Utils.easeInOutCubic(progress);
            
            window.scrollTo(0, startPosition + distance * ease);
            
            if (progress < 1) {
                requestAnimationFrame(animation);
            }
        }
        
        requestAnimationFrame(animation);
    },

    // Criar efeito ripple
    createRipple: function(element, event) {
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        const ripple = document.createElement('span');
        ripple.style.cssText = `
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 140, 66, 0.3);
            transform: scale(0);
            animation: ripple 0.6s linear;
            left: ${x}px;
            top: ${y}px;
            width: ${size}px;
            height: ${size}px;
            pointer-events: none;
        `;
        
        element.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    },

    // Log para debug
    log: function(message, type = 'info') {
        const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : '🔍';
        console.log(`${prefix} ${message}`);
    },

    // Função throttle para otimizar eventos
    throttle: function(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    }
};

// ===== SISTEMA FAQ =====
const FAQ = {
    init: function() {
        const faqItems = document.querySelectorAll('.faq-item');
        const faqQuestions = document.querySelectorAll('.faq-question');
        
        Utils.log(`FAQ Iniciado - Itens encontrados: ${faqItems.length}`);
        
        // Garantir que todos os itens começam fechados
        this.resetAll(faqItems);
        
        // Adicionar event listeners
        this.addEventListeners(faqQuestions);
        
        Utils.log('Sistema FAQ inicializado com sucesso', 'success');
    },

    resetAll: function(faqItems) {
        faqItems.forEach((item, index) => {
            // Remover classe active
            item.classList.remove('active');
            
            // Forçar remoção via JavaScript
            item.removeAttribute('class');
            item.className = 'faq-item';
            
            const answer = item.querySelector('.faq-answer');
            if (answer) {
                answer.style.maxHeight = '0';
                answer.style.opacity = '0';
                answer.style.display = 'block';
                answer.style.visibility = 'visible';
                answer.style.setProperty('opacity', '0', 'important');
                answer.style.setProperty('max-height', '0', 'important');
            }
            
            Utils.log(`FAQ Item ${index}: Iniciado como FECHADO (classe: ${item.className})`);
        });
    },

    addEventListeners: function(faqQuestions) {
        faqQuestions.forEach((question, index) => {
            question.addEventListener('click', (e) => this.handleClick(e, index));
            this.addHoverEffects(question);
        });
    },

    handleClick: function(event, index) {
        event.preventDefault();
        Utils.log(`FAQ clicado: ${index}`);
        
        const faqItem = event.currentTarget.closest('.faq-item');
        const faqAnswer = faqItem.querySelector('.faq-answer');
        
        // SEMPRE fechar todos os outros itens primeiro
        this.closeOthers(index);
        
        // Toggle do item clicado baseado apenas na resposta atual
        const currentHeight = faqAnswer.style.maxHeight;
        
        if (currentHeight === CONFIG.faqMaxHeight) {
            // Fechar
            this.closeItem(faqItem, faqAnswer, index);
        } else {
            // Abrir
            this.openItem(faqItem, faqAnswer, index, currentHeight);
        }
    },

    closeOthers: function(currentIndex) {
        const faqItems = document.querySelectorAll('.faq-item');
        faqItems.forEach((item, i) => {
            if (i !== currentIndex) {
                item.classList.remove('active');
                const answer = item.querySelector('.faq-answer');
                if (answer) {
                    answer.style.maxHeight = '0';
                    answer.style.opacity = '0';
                }
            }
        });
    },

    openItem: function(faqItem, faqAnswer, index, currentHeight) {
        faqItem.classList.add('active');
        faqAnswer.style.maxHeight = CONFIG.faqMaxHeight;
        faqAnswer.style.opacity = '1';
        faqAnswer.style.display = 'block';
        faqAnswer.style.visibility = 'visible';
        
        Utils.log(`FAQ ${index} ABERTO (height era ${currentHeight || '0'})`, 'success');
    },

    closeItem: function(faqItem, faqAnswer, index) {
        faqItem.classList.remove('active');
        faqAnswer.style.maxHeight = '0';
        faqAnswer.style.opacity = '0';
        
        Utils.log(`FAQ ${index} FECHADO (height era 300px)`);
    },

    addHoverEffects: function(question) {
        question.addEventListener('mousemove', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const moveX = (x - centerX) * 0.05;
            const moveY = (y - centerY) * 0.05;
            
            this.style.transform = `translate(${moveX}px, ${moveY}px)`;
        });
        
        question.addEventListener('mouseleave', function() {
            this.style.transform = 'translate(0, 0)';
        });
    }
};

// ===== SISTEMA DE NAVEGAÇÃO SUAVE =====
const Navigation = {
    init: function() {
        this.initScrollIndicator();
        this.initBackToTop();
        this.initSmoothScroll();
        this.initActiveNavigation();
        Utils.log('Sistema de navegação inicializado', 'success');
    },

    initActiveNavigation: function() {
        // Verificar se estamos na página inicial (landing page)
        if (window.location.pathname.endsWith('index-clean.html') || window.location.pathname.endsWith('/')) {
            this.updateActiveNavigation();
            
            // Atualizar navegação ativa quando o usuário rolar
            window.addEventListener('scroll', Utils.throttle(() => {
                this.updateActiveNavigation();
            }, 100));
        }
    },

    updateActiveNavigation: function() {
        const navbarLinks = document.querySelectorAll('.navbar-link');
        const sections = document.querySelectorAll('section[id]');
        
        let currentSection = '';
        
        // Encontrar a seção atual baseada no scroll
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.offsetHeight;
            
            if (window.pageYOffset >= sectionTop && window.pageYOffset < sectionTop + sectionHeight) {
                currentSection = section.getAttribute('id');
            }
        });
        
        // Atualizar classes ativas
        navbarLinks.forEach(link => {
            link.classList.remove('active');
            
            // Verificar se o link corresponde à seção atual
            const href = link.getAttribute('href');
            if (href === '#hero' && (!currentSection || currentSection === 'hero')) {
                link.classList.add('active');
            } else if (href === '#beneficios' && currentSection === 'beneficios') {
                link.classList.add('active');
            } else if (href === '#como-funciona' && currentSection === 'como-funciona') {
                link.classList.add('active');
            } else if (href === '#depoimentos' && currentSection === 'depoimentos') {
                link.classList.add('active');
            } else if (href === '#faq' && currentSection === 'faq') {
                link.classList.add('active');
            }
        });
    },

    initScrollIndicator: function() {
        const scrollIndicator = document.getElementById('scrollIndicator');
        if (!scrollIndicator) return;

        const scrollDots = scrollIndicator.querySelectorAll('.scroll-dot');
        const sections = {
            '#beneficios': document.getElementById('beneficios'),
            '#como-funciona': document.getElementById('como-funciona'),
            '#depoimentos': document.getElementById('depoimentos'),
            '#faq': document.getElementById('faq')
        };

        // Event listeners para os dots
        scrollDots.forEach(dot => {
            dot.addEventListener('click', (e) => this.handleDotClick(e, sections));
        });

        // Atualizar indicadores baseado no scroll
        window.addEventListener('scroll', () => this.updateScrollIndicators(scrollIndicator, sections));
        
        // Mostrar/esconder indicador baseado na posição
        window.addEventListener('scroll', () => this.toggleScrollIndicator(scrollIndicator));
    },

    handleDotClick: function(event, sections) {
        event.preventDefault();
        const target = event.currentTarget.dataset.target;
        const section = sections[target];
        
        if (section) {
            Utils.createRipple(event.currentTarget, event);
            Utils.smoothScrollTo(section);
            
            // Efeito de destaque na seção
            section.classList.add('section-highlight');
            setTimeout(() => {
                section.classList.remove('section-highlight');
            }, 2000);
        }
    },

    updateScrollIndicators: function(scrollIndicator, sections) {
        const scrollTop = window.pageYOffset;
        const viewportHeight = window.innerHeight;
        
        // Encontrar seção ativa
        let activeSection = null;
        let activeDot = null;
        
        Object.entries(sections).forEach(([id, section]) => {
            if (section) {
                const rect = section.getBoundingClientRect();
                const isVisible = rect.top <= viewportHeight * 0.6 && rect.bottom >= viewportHeight * 0.4;
                
                if (isVisible) {
                    activeSection = id;
                    activeDot = scrollIndicator.querySelector(`[data-target="${id}"]`);
                }
            }
        });
        
        // Atualizar classes dos dots
        scrollIndicator.querySelectorAll('.scroll-dot').forEach(dot => {
            dot.classList.remove('active');
        });
        
        if (activeDot) {
            activeDot.classList.add('active');
        }
    },

    toggleScrollIndicator: function(scrollIndicator) {
        const scrollTop = window.pageYOffset;
        const heroSection = document.getElementById('hero');
        
        if (heroSection) {
            const heroBottom = heroSection.offsetTop + heroSection.offsetHeight;
            
            if (scrollTop > heroBottom) {
                scrollIndicator.classList.add('visible');
            } else {
                scrollIndicator.classList.remove('visible');
            }
        }
    },

    initBackToTop: function() {
        const backToTop = document.getElementById('backToTop');
        if (!backToTop) return;

        // Forçar estado inicial
        backToTop.classList.add('hidden');
        backToTop.classList.remove('visible');
        backToTop.style.opacity = '0';
        backToTop.style.visibility = 'hidden';
        backToTop.style.transform = 'translateY(20px)';

        // Event listener para mostrar/esconder
        window.addEventListener('scroll', () => {
            const scrollTop = window.pageYOffset;
            const heroSection = document.querySelector('.hero-section');
            let isInHeroSection = false;
            
            if (heroSection) {
                const heroRect = heroSection.getBoundingClientRect();
                isInHeroSection = heroRect.bottom > 0;
            }
            
            if (scrollTop > 300 && !isInHeroSection) {
                backToTop.classList.remove('hidden');
                backToTop.classList.add('visible');
                backToTop.style.opacity = '0.7';
                backToTop.style.visibility = 'visible';
                backToTop.style.transform = 'translateY(0)';
            } else {
                backToTop.classList.add('hidden');
                backToTop.classList.remove('visible');
                backToTop.style.opacity = '0';
                backToTop.style.visibility = 'hidden';
                backToTop.style.transform = 'translateY(20px)';
            }
        });

        // Event listener para clique
        backToTop.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
            
            // Esconder imediatamente
            backToTop.classList.add('hidden');
            backToTop.classList.remove('visible');
            backToTop.style.opacity = '0';
            backToTop.style.visibility = 'hidden';
            backToTop.style.transform = 'translateY(20px)';
        });
    },

    initSmoothScroll: function() {
        // Aplicar smooth scroll a todos os links com hash
        document.querySelectorAll('a[href^="#"]').forEach(link => {
            link.addEventListener('click', (e) => {
                const targetId = link.getAttribute('href');
                
                // Verificar se o targetId é válido (não apenas '#')
                if (targetId && targetId !== '#' && targetId.length > 1) {
                    const targetElement = document.querySelector(targetId);
                
                if (targetElement) {
                    e.preventDefault();
                    Utils.smoothScrollTo(targetElement);
                    }
                }
            });
        });
    }
};

// ===== SISTEMA DE CARDS INTERATIVOS =====
const InteractiveCards = {
    init: function() {
        this.initInnovationCards();
        this.initAudienceCards();
        this.initBenefitCards();
        Utils.log('Cards interativos inicializados', 'success');
    },

    initInnovationCards: function() {
        const innovationCards = document.querySelectorAll('.innovation-card');
        
        innovationCards.forEach((card, index) => {
            // Criar elemento de descrição dinamicamente
            const description = document.createElement('div');
            description.className = 'innovation-description';
            description.textContent = card.dataset.description;
            card.appendChild(description);
            
            // Adicionar evento de click
            card.addEventListener('click', (e) => this.handleInnovationCardClick(e, innovationCards, index));
        });
    },

    handleInnovationCardClick: function(event, allCards, currentIndex) {
        event.preventDefault();
        event.stopPropagation();
        
        Utils.log(`Card de inovação clicado: ${currentIndex}`);
        const isActive = event.currentTarget.classList.contains('active');
        
        // Remover classe active de todos os cards
        allCards.forEach(otherCard => {
            otherCard.classList.remove('active');
        });
        
        // Se não estava ativo, ativar este
        if (!isActive) {
            event.currentTarget.classList.add('active');
            Utils.log(`Card de inovação ativado: ${currentIndex}`, 'success');
        }
    },

    initAudienceCards: function() {
        const audienceCards = document.querySelectorAll('.card-estudantes, .card-familias, .card-escolas');
        
        audienceCards.forEach((card, index) => {
            card.addEventListener('click', (e) => this.handleAudienceCardClick(e, card));
        });
    },

    handleAudienceCardClick: function(event, card) {
        event.preventDefault();
        
        // Efeito de "explosão" visual
        card.style.transform = 'translateY(-20px) scale(1.05)';
        card.style.transition = 'all 0.2s ease';
        
        setTimeout(() => {
            card.style.transform = 'translateY(-15px) scale(1.03)';
            card.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        }, 150);
        
        // Adicionar classe especial
        card.classList.add('audience-card-clicked');
        setTimeout(() => {
            card.classList.remove('audience-card-clicked');
        }, 800);
        
        Utils.log(`Card de audiência clicado: ${card.classList[1]}`);
        
        // Navegação específica por tipo
        this.handleAudienceNavigation(card);
    },

    handleAudienceNavigation: function(card) {
        const cardType = card.classList[1];
        
        if (cardType === 'card-estudantes') {
            // Scroll para seção de planos
            const planosLink = document.querySelector('a[href="planos.html"]');
            if (planosLink) planosLink.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (cardType === 'card-familias') {
            // Scroll para FAQ
            const faqSection = document.querySelector('#faq');
            if (faqSection) Utils.smoothScrollTo(faqSection);
        } else if (cardType === 'card-escolas') {
            // Scroll para CTA final
            const ctaSection = document.querySelector('.section-primary');
            if (ctaSection) Utils.smoothScrollTo(ctaSection);
        }
    },

    initBenefitCards: function() {
        const benefitCards = document.querySelectorAll('.card:not(.card-estudantes):not(.card-familias):not(.card-escolas)');
        
        benefitCards.forEach((card, index) => {
            card.addEventListener('click', (e) => {
                Utils.log(`Card de benefício clicado: ${index}`);
                Utils.createRipple(card, e);
            });
        });
    }
};

// ===== SISTEMA DE NAVEGAÇÃO MOBILE =====
const MobileNav = {
    init: function() {
        const toggle = document.querySelector('.navbar-toggle');
        const menu = document.querySelector('.navbar-menu');
        
        Utils.log(`MobileNav: Toggle encontrado: ${!!toggle}`);
        Utils.log(`MobileNav: Menu encontrado: ${!!menu}`);
        
        if (toggle && menu) {
            // Adicionar evento de clique no toggle
            toggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                Utils.log('Toggle clicado!');
                this.toggleMenu(toggle, menu);
            });
            
            // Fechar menu ao clicar em links
            const menuLinks = menu.querySelectorAll('.navbar-link');
            Utils.log(`MobileNav: ${menuLinks.length} links encontrados no menu`);
            
            menuLinks.forEach(link => {
                link.addEventListener('click', () => {
                    Utils.log('Link do menu clicado, fechando menu');
                    this.closeMenu(toggle, menu);
                });
            });
            
            // Fechar menu ao clicar fora dele
            document.addEventListener('click', (e) => {
                if (!toggle.contains(e.target) && !menu.contains(e.target)) {
                    this.closeMenu(toggle, menu);
                }
            });
            
            Utils.log('Sistema de navegação mobile inicializado', 'success');
        } else {
            Utils.log('Erro: Elementos do menu mobile não encontrados', 'error');
        }
    },

    toggleMenu: function(toggle, menu) {
        const isActive = menu.classList.contains('active');
        Utils.log(`Toggle menu - Estado atual: ${isActive ? 'aberto' : 'fechado'}`);
        
        if (isActive) {
            this.closeMenu(toggle, menu);
        } else {
            this.openMenu(toggle, menu);
        }
    },
    
    openMenu: function(toggle, menu) {
        Utils.log('Abrindo menu mobile...');
        menu.classList.add('active');
        toggle.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevenir scroll do body
        
        // Forçar reflow para garantir que as classes sejam aplicadas
        menu.offsetHeight;
        
        Utils.log('Menu mobile aberto', 'success');
    },
    
    closeMenu: function(toggle, menu) {
        Utils.log('Fechando menu mobile...');
        menu.classList.remove('active');
        toggle.classList.remove('active');
        document.body.style.overflow = ''; // Restaurar scroll do body
        
        // Forçar reflow para garantir que as classes sejam removidas
        menu.offsetHeight;
        
        Utils.log('Menu mobile fechado');
    }
};

// ===== SISTEMA DE LOGIN =====
const Login = {
    init: function() {
        this.initLoginButtons();
        Utils.log('Sistema de login inicializado', 'info');
    },

    initLoginButtons: function() {
        const loginButtons = document.querySelectorAll('button.btn-primary');
        loginButtons.forEach(button => {
            if (button.textContent.trim() === 'Entrar') {
                button.addEventListener('click', this.handleLoginClick);
            }
        });
    },

    handleLoginClick: function(e) {
        e.preventDefault();
        Utils.showToast('Tela de login em breve! 🚀', 'info');
        Utils.log('Botão Entrar clicado - funcionalidade em desenvolvimento', 'info');
    }
};

// ===== INICIALIZAÇÃO PRINCIPAL =====
const App = {
    init: function() {
        Utils.log('🚀 YüFin App iniciando...');
        
        // Aguardar carregamento completo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.start());
        } else {
            this.start();
        }
    },

    start: function() {
        try {
            FAQ.init();
            Navigation.init();
            InteractiveCards.init();
            MobileNav.init();
            Login.init();
            
            Utils.log('✅ YüFin App inicializado com sucesso!', 'success');
        } catch (error) {
            Utils.log(`Erro na inicialização: ${error.message}`, 'error');
        }
    }
};

// Inicializar aplicação
App.init();

// Função de teste para debug
window.testMobileMenu = function() {
    const toggle = document.querySelector('.navbar-toggle');
    const menu = document.querySelector('.navbar-menu');
    
    console.log('=== TESTE DO MENU MOBILE ===');
    console.log('Toggle encontrado:', !!toggle);
    console.log('Menu encontrado:', !!menu);
    
    if (toggle) {
        console.log('Classes do toggle:', toggle.className);
        console.log('Estilos do toggle:', window.getComputedStyle(toggle).display);
    }
    
    if (menu) {
        console.log('Classes do menu:', menu.className);
        console.log('Estilos do menu:', {
            position: window.getComputedStyle(menu).position,
            display: window.getComputedStyle(menu).display,
            transform: window.getComputedStyle(menu).transform,
            opacity: window.getComputedStyle(menu).opacity,
            visibility: window.getComputedStyle(menu).visibility
        });
    }
    
    // Simular clique no toggle
    if (toggle) {
        console.log('Simulando clique no toggle...');
        toggle.click();
    }
};

// Exportar para uso global se necessário
window.YuFinApp = {
    FAQ,
    Navigation,
    InteractiveCards,
    MobileNav,
    Login,
    Utils,
    CONFIG,
    testMobileMenu: window.testMobileMenu
};
