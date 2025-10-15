/**
 * YüFin - Módulo FAQ
 */

export function initFAQ() {
    console.log('🔍 FAQ Iniciado');
    
    const faqItems = document.querySelectorAll('.faq-item');
    const faqQuestions = document.querySelectorAll('.faq-question');
    const faqAnswers = document.querySelectorAll('.faq-answer');
    
    console.log('🔍 FAQ - Itens encontrados:', faqItems.length);
    
    // Garantir que todos os itens começam fechados
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
        
        console.log(`📋 FAQ Item ${index}: Iniciado como FECHADO (classe: ${item.className})`);
    });
    
    faqQuestions.forEach((question, index) => {
        question.addEventListener('click', function(e) {
            e.preventDefault();
            console.log(`🖱️ FAQ clicado: ${index}`);
            
            const faqItem = this.closest('.faq-item');
            const faqAnswer = faqItem.querySelector('.faq-answer');
            
            // SEMPRE fechar todos os outros itens primeiro
            faqItems.forEach((item, i) => {
                if (i !== index) {
                    item.classList.remove('active');
                    const answer = item.querySelector('.faq-answer');
                    if (answer) {
                        answer.style.maxHeight = '0';
                        answer.style.opacity = '0';
                    }
                }
            });
            
            // Toggle do item clicado baseado apenas na resposta atual
            const currentHeight = faqAnswer.style.maxHeight;
            
            if (currentHeight === '300px') {
                // Fechar
                faqItem.classList.remove('active');
                faqAnswer.style.maxHeight = '0';
                faqAnswer.style.opacity = '0';
                console.log(`❌ FAQ ${index} FECHADO (height era 300px)`);
            } else {
                // Abrir
                faqItem.classList.add('active');
                faqAnswer.style.maxHeight = '300px';
                faqAnswer.style.opacity = '1';
                faqAnswer.style.display = 'block';
                faqAnswer.style.visibility = 'visible';
                console.log(`✅ FAQ ${index} ABERTO (height era ${currentHeight || '0'})`);
            }
        });
        
        // Efeito de hover magnético
        question.addEventListener('mousemove', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 10;
            const rotateY = (centerX - x) / 10;
            
            this.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
        });
        
        question.addEventListener('mouseleave', function() {
            this.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)';
        });
    });
    
    console.log('✅ FAQ Inicializado com sucesso!');
}

