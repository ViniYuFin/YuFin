/**
 * YüFin - Módulo de Navegação
 */

export function initNavigation() {
    console.log('🧭 Navegação iniciada');
    
    // Elementos
    const scrollIndicator = document.getElementById('scrollIndicator');
    const backToTop = document.getElementById('backToTop');
    const heroSection = document.querySelector('.hero-section');
    
    // Seções para navegação
    const sections = {
        '#beneficios': document.querySelector('#beneficios'),
        '#como-funciona': document.querySelector('#como-funciona'),
        '#depoimentos': document.querySelector('#depoimentos'),
        '#faq': document.querySelector('#faq')
    };
    
    console.log('🔍 Seções encontradas:', Object.keys(sections).filter(key => sections[key]));
    
    // Função de scroll suave
    function smoothScrollTo(target) {
        const element = document.querySelector(target);
        if (element) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }
    
    // Função para criar efeito ripple
    function createRipple(element, event) {
        const ripple = document.createElement('span');
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple');
        
        element.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }
    
    // Inicializar indicador de scroll
    if (scrollIndicator) {
        console.log('✅ Indicador de scroll encontrado');
        
        // Adicionar event listeners aos dots
        const scrollDots = scrollIndicator.querySelectorAll('.scroll-dot');
        scrollDots.forEach((dot, index) => {
            dot.addEventListener('click', function(e) {
                e.preventDefault();
                const target = this.dataset.target;
                
                if (target) {
                    // Scroll suave imediato
                    smoothScrollTo(target);
                    console.log('🧭 Navegação por dot para:', target);
                }
            });
        });
    } else {
        console.log('❌ Indicador de scroll NÃO encontrado');
    }
    
    // Inicializar botão voltar ao topo
    if (backToTop) {
        console.log('✅ Botão voltar ao topo encontrado');
        
        backToTop.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🔄 Botão voltar ao topo clicado');
            
            // Efeito ripple
            createRipple(this, e);
            
            // Scroll direto para o topo
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
            
            console.log('📈 Scroll para o topo iniciado');
            
            // Esconder o botão imediatamente
            this.classList.add('hidden');
            this.classList.remove('visible');
        });
    } else {
        console.log('❌ Botão voltar ao topo NÃO encontrado');
    }
    
    // Mostrar/esconder indicadores baseado no scroll
    let ticking = false;
    
    function updateScrollIndicators() {
        const scrollTop = window.pageYOffset;
        const windowHeight = window.innerHeight;
        
        // Verificar se está na seção hero (início da tela)
        let isInHeroSection = false;
        if (heroSection) {
            const heroRect = heroSection.getBoundingClientRect();
            isInHeroSection = heroRect.bottom > 0;
        }
        
        // Mostrar/esconder indicador lateral
        if (scrollIndicator) {
            if (isInHeroSection) {
                scrollIndicator.classList.add('hidden');
                scrollIndicator.classList.remove('visible');
            } else {
                scrollIndicator.classList.remove('hidden');
                scrollIndicator.classList.add('visible');
            }
        }
        
        // Mostrar/esconder botão voltar ao topo
        if (backToTop) {
            if (scrollTop > 300 && !isInHeroSection) {
                backToTop.classList.remove('hidden');
                backToTop.classList.add('visible');
            } else {
                backToTop.classList.add('hidden');
                backToTop.classList.remove('visible');
            }
        }
        
        // Atualizar dots ativos
        if (scrollIndicator) {
            const scrollDots = scrollIndicator.querySelectorAll('.scroll-dot');
            let activeDot = null;
            
            // Encontrar a seção ativa
            for (const [target, element] of Object.entries(sections)) {
                if (element) {
                    const rect = element.getBoundingClientRect();
                    const isVisible = rect.top <= windowHeight * 0.3 && rect.bottom >= windowHeight * 0.3;
                    
                    if (isVisible) {
                        const dot = scrollIndicator.querySelector(`[data-target="${target}"]`);
                        if (dot) {
                            activeDot = dot;
                            break;
                        }
                    }
                }
            }
            
            // Remover active de todos os dots
            scrollDots.forEach(dot => dot.classList.remove('active'));
            
            // Adicionar active ao dot correto
            if (activeDot) {
                activeDot.classList.add('active');
            }
        }
        
        ticking = false;
    }
    
    // Throttle do scroll
    function onScroll() {
        if (!ticking) {
            requestAnimationFrame(updateScrollIndicators);
            ticking = true;
        }
    }
    
    // Event listeners
    window.addEventListener('scroll', onScroll, { passive: true });
    
    // Inicializar estado
    updateScrollIndicators();
    
    console.log('✅ Navegação inicializada com sucesso!');
}

