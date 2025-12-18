import React, { useState } from 'react';

const onboardingSteps = {
  student: [
    {
      title: 'Bem-vindo ao YuFin! 🎉',
      description: 'Aqui você aprende sobre finanças brincando, ganha XP, sobe de nível e conquista recompensas!'
    },
    {
      title: 'Trilha de Aprendizagem',
      description: 'Complete lições para ganhar XP, moedas e avançar no seu caminho de aprendizado.'
    },
    {
      title: 'Poupança Educativa',
      description: 'Ao aprender, você também acumula dinheiro virtual na sua poupança. Peça para seu responsável configurar as regras!'
    },
    {
      title: 'Conquistas e Ranking',
      description: 'Desafie-se, conquiste medalhas e veja seu nome no ranking dos melhores alunos!'
    },
    {
      title: 'Pronto para começar?',
      description: 'Clique em "Começar" e aproveite sua jornada!'
    }
  ],
  parent: [
    {
      title: 'Bem-vindo ao Painel do Responsável! 👨‍👩‍👧‍👦',
      description: 'Acompanhe o progresso dos seus filhos, configure incentivos e veja relatórios detalhados.'
    },
    {
      title: 'Configuração de Poupança',
      description: 'Defina quanto cada lição, ofensiva ou conquista vale em dinheiro real para incentivar o aprendizado.'
    },
    {
      title: 'Relatórios e Recomendações',
      description: 'Receba dicas e veja o desempenho de cada filho por matéria, progresso e engajamento.'
    },
    {
      title: 'Pronto para acompanhar?',
      description: 'Clique em "Começar" para explorar o painel!' 
    }
  ],
  school: [
    {
      title: 'Bem-vindo ao Painel da Escola! 🏫',
      description: 'Visualize o desempenho de todos os alunos, turmas e matérias em tempo real.'
    },
    {
      title: 'Ranking e Engajamento',
      description: 'Veja os alunos e turmas de destaque, taxas de engajamento e conquistas.'
    },
    {
      title: 'Relatórios Detalhados',
      description: 'Exporte relatórios e use os dados para melhorar o ensino.'
    },
    {
      title: 'Pronto para liderar?',
      description: 'Clique em "Começar" para usar o painel escolar!'
    }
  ]
};

const OnboardingModal = ({ profile, onFinish }) => {
  const steps = onboardingSteps[profile] || onboardingSteps.student;
  const [step, setStep] = useState(0);

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onFinish();
    }
  };

  const handleSkip = () => {
    onFinish();
  };

  // Função para renderizar o título com fonte especial para 'YuFin'
  const renderTitle = (title) => {
    if (profile === 'student' && step === 0) {
      return (
        <span>
          Bem-vindo ao <span className="font-cherry">YuFin</span>! 🎉
        </span>
      );
    }
    return title;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center animate-fadeIn">
        <h2 className="text-2xl font-bold text-primary mb-4">{renderTitle(steps[step].title)}</h2>
        <p className="text-gray-700 mb-6">{steps[step].description}</p>
        <div className="flex justify-between items-center mt-6">
          <button
            onClick={handleSkip}
            className="text-gray-500 hover:text-primary text-sm px-4 py-2 rounded"
          >
            Pular
          </button>
          <button
            onClick={handleNext}
            className="bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-dark transition"
          >
            {step === steps.length - 1 ? 'Começar' : 'Avançar'}
          </button>
        </div>
        <div className="flex justify-center mt-4 space-x-2">
          {steps.map((_, idx) => (
            <span
              key={idx}
              className={`inline-block w-3 h-3 rounded-full ${idx === step ? 'bg-primary' : 'bg-gray-300'}`}
            ></span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal; 