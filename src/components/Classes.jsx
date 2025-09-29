import React, { useEffect, useState } from 'react';
import { apiGet, apiPost, apiPatch, apiDelete } from '../utils/apiService';

const Classes = ({ user, onChange }) => {
  // Função para normalizar caracteres de série (aceita º, °, o, etc.)
  const normalizeGrade = (grade) => {
    if (!grade) return '';
    return grade
      .replace(/(\d+)[º°o]\s*Ano/g, '$1º Ano') // Converte 6º, 6°, 6o para 6º Ano
      .replace(/\s+/g, ' ')   // Remove espaços extras
      .trim();
  };

  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newClassName, setNewClassName] = useState('');
  const [newClassGrade, setNewClassGrade] = useState('');
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editGrade, setEditGrade] = useState('');
  const [allStudents, setAllStudents] = useState([]);
  const [searchStudent, setSearchStudent] = useState('');
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [allTeachers, setAllTeachers] = useState([]);
  const [newClassTeacher, setNewClassTeacher] = useState('');
  const [editTeacher, setEditTeacher] = useState('');

  useEffect(() => {
    fetchClasses();
    fetchAllStudents();
  }, []);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const data = await apiGet('/classes');
      setClasses(data);
    } catch (err) {
      setError('Erro ao carregar turmas');
    }
    setLoading(false);
  };

  const fetchAllStudents = async () => {
    setLoadingStudents(true);
    try {
      const users = await apiGet('/users');
      
      // Filtrar apenas alunos que pertencem à escola atual
      const schoolStudents = users.filter(u => 
        u.role === 'student' && u.schoolId === user.id
      );
      
      setAllStudents(schoolStudents);
    } catch (err) {
      setError('Erro ao carregar alunos');
    }
    setLoadingStudents(false);
  };

  const handleAddClass = async () => {
    if (!newClassGrade || !newClassTeacher) {
      setError('Série/Ano e Professor são obrigatórios');
      return;
    }
    
    try {
      const normalizedGrade = normalizeGrade(newClassGrade);
      const existingClassesInGrade = classes.filter(c => normalizeGrade(c.grade) === normalizedGrade);
      const nextLetter = String.fromCharCode(65 + existingClassesInGrade.length);
      const autoClassName = `Turma ${nextLetter}`;
      
      const newClass = {
        name: autoClassName,
        grade: newClassGrade,
        students: [],
        teacher: newClassTeacher
      };
      await apiPost('/classes', newClass);
      setNewClassName('');
      setNewClassGrade('');
      setNewClassTeacher('');
      setError(null);
      await fetchClasses();
      await fetchAllStudents();
      if (onChange) onChange();
    } catch (err) {
      setError('Erro ao adicionar turma');
    }
  };

  const handleEditClass = (turma) => {
    setEditingId(turma.id);
    setEditName(turma.name);
    setEditGrade(turma.grade);
    setEditTeacher(turma.teacher || '');
  };

  const handleSaveEdit = async (id) => {
    try {
      await apiPatch(`/classes/${id}`, { name: editName, grade: editGrade, teacher: editTeacher });
      setEditingId(null);
      await fetchClasses();
      await fetchAllStudents();
      if (onChange) onChange();
    } catch (err) {
      setError('Erro ao editar turma');
    }
  };

  const handleDeleteClass = async (id) => {
    if (!window.confirm('Tem certeza que deseja remover esta turma?')) return;
    try {
      await apiDelete(`/classes/${id}`);
      await fetchClasses();
      await fetchAllStudents();
      if (onChange) onChange();
    } catch (err) {
      setError('Erro ao remover turma');
    }
  };

  const handleAddStudent = async (classId, studentId) => {
    try {
      await apiPatch(`/classes/${classId}/add-student`, { studentId });
      fetchClasses();
      if (onChange) onChange();
    } catch (err) {
      setError(err.message || 'Erro ao adicionar aluno');
    }
  };

  const handleRemoveStudent = async (classId, studentId) => {
    try {
      await apiPatch(`/classes/${classId}/remove-student`, { studentId });
      fetchClasses();
      if (onChange) onChange();
    } catch (err) {
      setError('Erro ao remover aluno');
    }
  };

  return (
    <div className="min-h-screen bg-interface p-4 pb-20">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 border-2 mb-6" style={{ borderColor: 'rgb(238, 145, 22)' }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Gestão Escolar</h2>
          </div>
          
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-800">📚 Gestão de Turmas</h3>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Gerenciar Turmas</h3>
              <button
                onClick={handleAddClass}
                className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-dark transition"
              >
                Adicionar Turma
              </button>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4 items-center mb-4">
              <input
                type="text"
                placeholder="Série/Ano (ex: 6º Ano, 7º Ano)"
                value={newClassGrade}
                onChange={e => setNewClassGrade(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg flex-1 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors duration-200"
              />
              <input
                type="text"
                placeholder="Professor"
                value={newClassTeacher}
                onChange={e => setNewClassTeacher(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg flex-1 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors duration-200"
              />
            </div>
            
            {error && <p className="text-red-600 mb-2">{error}</p>}
            
            <div className="bg-blue-50 rounded-lg p-3 mb-4 border border-blue-200">
              <p className="text-sm text-blue-700">
                💡 <strong>Dica:</strong> O nome da turma será gerado automaticamente (Turma A, Turma B, etc.) baseado na série selecionada.
              </p>
            </div>
            
            {loading ? (
              <p>Carregando turmas...</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {classes.length === 0 && (
                  <p className="text-gray-600 col-span-2">Nenhuma turma cadastrada ainda.</p>
                )}
                {classes.map((turma) => (
                  <div key={turma.id} className="bg-gray-50 rounded-lg p-4 border shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-bold text-gray-800">{turma.name}</h3>
                      <button
                        className="text-xs text-primary underline"
                        onClick={() => {
                          setSelectedClassId(selectedClassId === turma.id ? null : turma.id);
                          if (selectedClassId !== turma.id) fetchAllStudents();
                        }}
                      >
                        {selectedClassId === turma.id ? 'Fechar' : 'Gerenciar Alunos'}
                      </button>
                    </div>
                    <p className="text-gray-600">Série: {turma.grade}</p>
                    <p className="text-gray-600">Professor: {turma.teacher}</p>
                    <p className="text-gray-600 mb-2">Alunos: {turma.students ? turma.students.length : 0}</p>
                    
                    {editingId === turma.id ? (
                      <>
                        <input
                          type="text"
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          className="p-2 border rounded-md mb-2 w-full"
                        />
                        <input
                          type="text"
                          value={editGrade}
                          onChange={e => setEditGrade(e.target.value)}
                          className="p-2 border rounded-md mb-2 w-full"
                        />
                        <input
                          type="text"
                          value={editTeacher}
                          onChange={e => setEditTeacher(e.target.value)}
                          placeholder="Professor"
                          className="p-2 border rounded-md mb-2 w-full"
                        />
                        <div className="flex gap-2">
                          <button onClick={() => handleSaveEdit(turma.id)} className="bg-primary text-white px-3 py-1 rounded">Salvar</button>
                          <button onClick={() => setEditingId(null)} className="bg-gray-300 text-gray-800 px-3 py-1 rounded">Cancelar</button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => handleEditClass(turma)} className="px-3 py-1 rounded" style={{ background: '#EE9116', color: 'white' }}>Editar</button>
                          <button onClick={() => handleDeleteClass(turma.id)} className="bg-red-500 text-white px-3 py-1 rounded">Remover</button>
                        </div>
                      </>
                    )}
                    
                    {selectedClassId === turma.id && (
                      <div className="mt-4 p-3 bg-orange-50 rounded">
                        <h4 className="font-semibold mb-2">Alunos da Turma</h4>
                        {turma.students && turma.students.length > 0 ? (
                          <ul className="mb-2">
                            {turma.students.map(studentId => {
                              const student = allStudents.find(s => s.id.toString() === studentId);
                              return student ? (
                                <li key={student.id} className="flex justify-between items-center border-b py-1">
                                  <span>{student.name}</span>
                                  <button onClick={() => handleRemoveStudent(turma.id, student.id)} className="text-xs text-red-600 underline">Remover</button>
                                </li>
                              ) : null;
                            })}
                          </ul>
                        ) : (
                          <p className="text-gray-500 mb-2">Nenhum aluno vinculado.</p>
                        )}
                        <input
                          type="text"
                          placeholder="Buscar aluno pelo nome..."
                          value={searchStudent}
                          onChange={e => setSearchStudent(e.target.value)}
                          className="p-2 border rounded-md w-full mb-2"
                        />
                        {loadingStudents ? (
                          <p>Carregando alunos...</p>
                        ) : (
                          <ul>
                            {allStudents
                              .filter(s => {
                                // Verificar se o aluno não está na turma atual
                                const notInCurrentClass = !turma.students || !turma.students.includes(s.id.toString());
                                
                                // Verificar se o aluno não está em nenhuma outra turma
                                const notInOtherClasses = !classes.some(otherClass => 
                                  otherClass.id !== turma.id && 
                                  otherClass.students && 
                                  otherClass.students.includes(s.id.toString())
                                );
                                
                                // Filtrar por nome
                                const matchesSearch = s.name.toLowerCase().includes(searchStudent.toLowerCase());
                                
                                return notInCurrentClass && notInOtherClasses && matchesSearch;
                              })
                              .slice(0, 5)
                              .map(s => (
                                <li key={s.id} className="flex justify-between items-center border-b py-1">
                                  <span>{s.name}</span>
                                  <button onClick={() => handleAddStudent(turma.id, s.id)} className="text-xs text-primary underline">Adicionar</button>
                                </li>
                              ))}
                            {allStudents
                              .filter(s => {
                                // Alunos que estão em outras turmas
                                const inOtherClasses = classes.some(otherClass => 
                                  otherClass.id !== turma.id && 
                                  otherClass.students && 
                                  otherClass.students.includes(s.id.toString())
                                );
                                
                                const matchesSearch = s.name.toLowerCase().includes(searchStudent.toLowerCase());
                                
                                return inOtherClasses && matchesSearch;
                              })
                              .slice(0, 3)
                              .map(s => {
                                const otherClass = classes.find(c => 
                                  c.id !== turma.id && 
                                  c.students && 
                                  c.students.includes(s.id.toString())
                                );
                                return (
                                  <li key={s.id} className="flex justify-between items-center border-b py-1">
                                    <span className="text-gray-500">{s.name} (em {otherClass?.name})</span>
                                    <span className="text-xs text-gray-400">Já vinculado</span>
                                  </li>
                                );
                              })}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Classes; 