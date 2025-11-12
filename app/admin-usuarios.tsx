import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert, Dimensions, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../constants/Colors';
import { useAuth } from './contexts/AuthContext';
import AppHeader from '../components/AppHeader';
import { Ionicons } from '@expo/vector-icons';
import { 
  listarUsuariosCompleto, 
  getPacienteDetalhes, 
  getPsicologoDetalhes,
  editarPacienteAdmin,
  editarPsicologoAdmin,
  excluirPacienteAdmin,
  excluirPsicologoAdmin
} from '../lib/api';
import EmptyState from '../components/EmptyState';

type Usuario = {
  id: number;
  nome: string;
  email: string;
  tipo: 'paciente' | 'psicologo';
  [key: string]: any;
};

export default function AdminUsuarios() {
  const { token, user } = useAuth();
  const [usuarios, setUsuarios] = useState<{ pacientes: Usuario[]; psicologos: Usuario[] }>({ pacientes: [], psicologos: [] });
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<'todos' | 'pacientes' | 'psicologos'>('todos');
  const [busca, setBusca] = useState('');
  
  // Estados para modais
  const [modalDetalhes, setModalDetalhes] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [modalExcluir, setModalExcluir] = useState(false);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<Usuario | null>(null);
  const [detalhesCompletos, setDetalhesCompletos] = useState<any>(null);
  const [carregandoDetalhes, setCarregandoDetalhes] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  
  // Estados do formulário de edição
  const [formData, setFormData] = useState<any>({});

  const carregarUsuarios = useCallback(async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const dados = await listarUsuariosCompleto(token);
      setUsuarios({
        pacientes: (dados.pacientes || []).map((p: any) => ({ ...p, tipo: 'paciente' as const })),
        psicologos: (dados.psicologos || []).map((p: any) => ({ ...p, tipo: 'psicologo' as const }))
      });
    } catch (error: any) {
      console.error('Erro ao carregar usuários:', error);
      Alert.alert('Erro', 'Não foi possível carregar os usuários.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    carregarUsuarios();
  }, [carregarUsuarios]);

  const abrirDetalhes = async (usuario: Usuario) => {
    setUsuarioSelecionado(usuario);
    setCarregandoDetalhes(true);
    setModalDetalhes(true);
    
    try {
      let detalhes;
      if (usuario.tipo === 'paciente') {
        detalhes = await getPacienteDetalhes(usuario.id, token!);
      } else {
        detalhes = await getPsicologoDetalhes(usuario.id, token!);
      }
      setDetalhesCompletos(detalhes);
    } catch (error: any) {
      console.error('Erro ao carregar detalhes:', error);
      Alert.alert('Erro', 'Não foi possível carregar os detalhes do usuário.');
    } finally {
      setCarregandoDetalhes(false);
    }
  };

  const abrirEditar = (usuario: Usuario) => {
    setUsuarioSelecionado(usuario);
    setFormData({
      nome: usuario.nome || '',
      email: usuario.email || '',
      ...(usuario.tipo === 'paciente' ? {
        // Admin não pode editar dados pessoais dos pacientes
      } : {
        crp: usuario.crp || '',
        especializacoes: Array.isArray(usuario.especializacoes) 
          ? usuario.especializacoes.join(', ') 
          : (usuario.especializacoes || ''),
        bio: usuario.bio || '',
        foto_perfil: usuario.foto_perfil || '',
        disponivel: usuario.disponivel || false,
        perfil_completo: usuario.perfil_completo || false,
        aprovado: usuario.aprovado !== undefined ? usuario.aprovado : true
      })
    });
    setModalEditar(true);
  };

  const abrirExcluir = (usuario: Usuario) => {
    setUsuarioSelecionado(usuario);
    setModalExcluir(true);
  };

  const salvarEdicao = async () => {
    if (!usuarioSelecionado || !token) return;
    
    setSalvando(true);
    try {
      const dadosParaEnviar = { ...formData };
      
      // Processar especializações se for psicólogo
      if (usuarioSelecionado.tipo === 'psicologo' && dadosParaEnviar.especializacoes) {
        dadosParaEnviar.especializacoes = dadosParaEnviar.especializacoes
          .split(',')
          .map((e: string) => e.trim())
          .filter((e: string) => e.length > 0);
      }
      
      if (usuarioSelecionado.tipo === 'paciente') {
        await editarPacienteAdmin(usuarioSelecionado.id, dadosParaEnviar, token);
      } else {
        await editarPsicologoAdmin(usuarioSelecionado.id, dadosParaEnviar, token);
      }
      
      Alert.alert('Sucesso', 'Usuário atualizado com sucesso!');
      setModalEditar(false);
      carregarUsuarios();
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      Alert.alert('Erro', error?.response?.data?.erro || 'Não foi possível atualizar o usuário.');
    } finally {
      setSalvando(false);
    }
  };

  const confirmarExclusao = async () => {
    if (!usuarioSelecionado || !token) return;
    
    setExcluindo(true);
    try {
      if (usuarioSelecionado.tipo === 'paciente') {
        await excluirPacienteAdmin(usuarioSelecionado.id, token);
      } else {
        await excluirPsicologoAdmin(usuarioSelecionado.id, token);
      }
      
      Alert.alert('Sucesso', 'Usuário excluído com sucesso!');
      setModalExcluir(false);
      carregarUsuarios();
    } catch (error: any) {
      console.error('Erro ao excluir:', error);
      Alert.alert('Erro', error?.response?.data?.erro || 'Não foi possível excluir o usuário.');
    } finally {
      setExcluindo(false);
    }
  };

  const usuariosFiltrados = React.useMemo(() => {
    let lista: Usuario[] = [];
    
    if (filtro === 'todos' || filtro === 'pacientes') {
      lista = [...lista, ...usuarios.pacientes];
    }
    if (filtro === 'todos' || filtro === 'psicologos') {
      lista = [...lista, ...usuarios.psicologos];
    }
    
    if (busca.trim()) {
      const buscaLower = busca.toLowerCase();
      lista = lista.filter(u => 
        u.nome?.toLowerCase().includes(buscaLower) ||
        u.email?.toLowerCase().includes(buscaLower)
      );
    }
    
    return lista;
  }, [usuarios, filtro, busca]);

  const renderUsuarioCard = (usuario: Usuario) => (
    <View key={`${usuario.tipo}-${usuario.id}`} style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardInfo}>
          <Text style={styles.cardNome}>{usuario.nome || 'Sem nome'}</Text>
          <Text style={styles.cardEmail}>{usuario.email}</Text>
          <View style={styles.badgeContainer}>
            <View style={[styles.badge, usuario.tipo === 'paciente' ? styles.badgePaciente : styles.badgePsicologo]}>
              <Text style={styles.badgeText}>
                {usuario.tipo === 'paciente' ? '👤 Paciente' : '🧠 Psicólogo'}
              </Text>
            </View>
            {usuario.tipo === 'psicologo' && (
              <>
                {usuario.aprovado && (
                  <View style={[styles.badge, styles.badgeAprovado]}>
                    <Text style={styles.badgeText}>✓ Aprovado</Text>
                  </View>
                )}
                {usuario.disponivel && (
                  <View style={[styles.badge, styles.badgeDisponivel]}>
                    <Text style={styles.badgeText}>✓ Disponível</Text>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </View>
      
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.buttonVer]}
          onPress={() => abrirDetalhes(usuario)}
        >
          <Ionicons name="eye-outline" size={18} color={Colors.card} />
          <Text style={styles.actionButtonText}>Ver</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.buttonEditar]}
          onPress={() => abrirEditar(usuario)}
        >
          <Ionicons name="create-outline" size={18} color={Colors.card} />
          <Text style={styles.actionButtonText}>Editar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.buttonExcluir]}
          onPress={() => abrirExcluir(usuario)}
        >
          <Ionicons name="trash-outline" size={18} color={Colors.card} />
          <Text style={styles.actionButtonText}>Excluir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Gerenciar Usuários" subtitle="Visualize, edite e exclua usuários" />
      
      <View style={styles.filtrosContainer}>
        <View style={styles.filtrosRow}>
          <TouchableOpacity
            style={[styles.filtroButton, filtro === 'todos' && styles.filtroButtonAtivo]}
            onPress={() => setFiltro('todos')}
          >
            <Text style={[styles.filtroButtonText, filtro === 'todos' && styles.filtroButtonTextAtivo]}>
              Todos ({usuarios.pacientes.length + usuarios.psicologos.length})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filtroButton, filtro === 'pacientes' && styles.filtroButtonAtivo]}
            onPress={() => setFiltro('pacientes')}
          >
            <Text style={[styles.filtroButtonText, filtro === 'pacientes' && styles.filtroButtonTextAtivo]}>
              Pacientes ({usuarios.pacientes.length})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filtroButton, filtro === 'psicologos' && styles.filtroButtonAtivo]}
            onPress={() => setFiltro('psicologos')}
          >
            <Text style={[styles.filtroButtonText, filtro === 'psicologos' && styles.filtroButtonTextAtivo]}>
              Psicólogos ({usuarios.psicologos.length})
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.buscaContainer}>
          <Ionicons name="search-outline" size={20} color={Colors.textSecondary} style={styles.buscaIcon} />
          <TextInput
            style={styles.buscaInput}
            placeholder="Buscar por nome ou email..."
            value={busca}
            onChangeText={setBusca}
            placeholderTextColor={Colors.textSecondary}
          />
          {busca.length > 0 && (
            <TouchableOpacity onPress={() => setBusca('')} style={styles.buscaClear}>
              <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <ActivityIndicator size="large" color={Colors.tint} style={styles.loader} />
        ) : usuariosFiltrados.length === 0 ? (
          <EmptyState 
            icon="👥" 
            title="Nenhum usuário encontrado" 
            hint={busca ? "Tente uma busca diferente" : "Não há usuários cadastrados"} 
          />
        ) : (
          usuariosFiltrados.map(renderUsuarioCard)
        )}
      </ScrollView>

      {/* Modal de Detalhes */}
      <Modal
        visible={modalDetalhes}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalDetalhes(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {usuarioSelecionado?.tipo === 'paciente' ? '👤 Detalhes do Paciente' : '🧠 Detalhes do Psicólogo'}
              </Text>
              <TouchableOpacity onPress={() => setModalDetalhes(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              {carregandoDetalhes ? (
                <ActivityIndicator size="large" color={Colors.tint} />
              ) : detalhesCompletos ? (
                <View>
                  {usuarioSelecionado?.tipo === 'paciente' ? (
                    <>
                      {/* Para pacientes, mostrar apenas informações básicas */}
                      <View style={styles.detalheItem}>
                        <Text style={styles.detalheLabel}>ID:</Text>
                        <Text style={styles.detalheValue}>{detalhesCompletos.id || 'N/A'}</Text>
                      </View>
                      <View style={styles.detalheItem}>
                        <Text style={styles.detalheLabel}>NOME:</Text>
                        <Text style={styles.detalheValue}>{detalhesCompletos.nome || 'Não informado'}</Text>
                      </View>
                      <View style={styles.detalheItem}>
                        <Text style={styles.detalheLabel}>EMAIL:</Text>
                        <Text style={styles.detalheValue}>{detalhesCompletos.email || 'Não informado'}</Text>
                      </View>
                      <View style={styles.detalheItem}>
                        <Text style={styles.detalheLabel}>DATA DE CRIAÇÃO:</Text>
                        <Text style={styles.detalheValue}>
                          {detalhesCompletos.data_criacao 
                            ? new Date(detalhesCompletos.data_criacao).toLocaleDateString('pt-BR')
                            : 'Não informado'}
                        </Text>
                      </View>
                      <View style={[styles.detalheItem, { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: Colors.border }]}>
                        <Text style={[styles.detalheValue, { color: Colors.textSecondary, fontStyle: 'italic', fontSize: 12 }]}>
                          🔒 Dados pessoais (idade, gênero, telefone, links, etc.) não são exibidos por questões de privacidade.
                        </Text>
                      </View>
                    </>
                  ) : (
                    <>
                      {/* Para psicólogos, mostrar todas as informações */}
                      {Object.entries(detalhesCompletos).map(([key, value]) => {
                        if (key === 'senha' || key === 'id' || key === 'telefone' || key === 'redes_sociais') return null;
                        if (key === 'especializacoes' && Array.isArray(value)) {
                          return (
                            <View key={key} style={styles.detalheItem}>
                              <Text style={styles.detalheLabel}>{key.replace('_', ' ').toUpperCase()}:</Text>
                              <Text style={styles.detalheValue}>{value.join(', ') || 'Nenhuma'}</Text>
                            </View>
                          );
                        }
                        return (
                          <View key={key} style={styles.detalheItem}>
                            <Text style={styles.detalheLabel}>{key.replace('_', ' ').toUpperCase()}:</Text>
                            <Text style={styles.detalheValue}>
                              {value !== null && value !== undefined ? String(value) : 'Não informado'}
                            </Text>
                          </View>
                        );
                      })}
                      
                      {/* Telefone */}
                      {detalhesCompletos.telefone && (
                        <View style={styles.detalheItem}>
                          <Text style={styles.detalheLabel}>TELEFONE:</Text>
                          <TouchableOpacity
                            onPress={() => Linking.openURL(`tel:${detalhesCompletos.telefone}`)}
                            style={styles.linkContainer}
                          >
                            <Ionicons name="call-outline" size={18} color={Colors.tint} />
                            <Text style={[styles.detalheValue, styles.linkText]}>
                              {detalhesCompletos.telefone}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}
                      
                      {/* Redes Sociais */}
                      {detalhesCompletos.redes_sociais && Object.keys(detalhesCompletos.redes_sociais).length > 0 && (
                        <View style={styles.detalheItem}>
                          <Text style={styles.detalheLabel}>REDES SOCIAIS:</Text>
                          <View style={styles.redesContainer}>
                            {detalhesCompletos.redes_sociais.instagram && (
                              <TouchableOpacity
                                style={styles.redeItem}
                                onPress={() => {
                                  const link = detalhesCompletos.redes_sociais.instagram.startsWith('http')
                                    ? detalhesCompletos.redes_sociais.instagram
                                    : detalhesCompletos.redes_sociais.instagram.startsWith('@')
                                    ? `https://instagram.com/${detalhesCompletos.redes_sociais.instagram.substring(1)}`
                                    : `https://instagram.com/${detalhesCompletos.redes_sociais.instagram}`;
                                  Linking.openURL(link).catch(() => Alert.alert('Erro', 'Link inválido'));
                                }}
                              >
                                <Ionicons name="logo-instagram" size={20} color="#E4405F" />
                                <Text style={[styles.detalheValue, styles.linkText, { marginLeft: 8 }]}>
                                  {detalhesCompletos.redes_sociais.instagram}
                                </Text>
                              </TouchableOpacity>
                            )}
                            
                            {detalhesCompletos.redes_sociais.linkedin && (
                              <TouchableOpacity
                                style={styles.redeItem}
                                onPress={() => {
                                  const link = detalhesCompletos.redes_sociais.linkedin.startsWith('http')
                                    ? detalhesCompletos.redes_sociais.linkedin
                                    : `https://linkedin.com/in/${detalhesCompletos.redes_sociais.linkedin}`;
                                  Linking.openURL(link).catch(() => Alert.alert('Erro', 'Link inválido'));
                                }}
                              >
                                <Ionicons name="logo-linkedin" size={20} color="#0077B5" />
                                <Text style={[styles.detalheValue, styles.linkText, { marginLeft: 8 }]}>
                                  {detalhesCompletos.redes_sociais.linkedin}
                                </Text>
                              </TouchableOpacity>
                            )}
                            
                            {detalhesCompletos.redes_sociais.facebook && (
                              <TouchableOpacity
                                style={styles.redeItem}
                                onPress={() => {
                                  const link = detalhesCompletos.redes_sociais.facebook.startsWith('http')
                                    ? detalhesCompletos.redes_sociais.facebook
                                    : `https://facebook.com/${detalhesCompletos.redes_sociais.facebook}`;
                                  Linking.openURL(link).catch(() => Alert.alert('Erro', 'Link inválido'));
                                }}
                              >
                                <Ionicons name="logo-facebook" size={20} color="#1877F2" />
                                <Text style={[styles.detalheValue, styles.linkText, { marginLeft: 8 }]}>
                                  {detalhesCompletos.redes_sociais.facebook}
                                </Text>
                              </TouchableOpacity>
                            )}
                            
                            {detalhesCompletos.redes_sociais.outros && Array.isArray(detalhesCompletos.redes_sociais.outros) && detalhesCompletos.redes_sociais.outros.length > 0 && (
                              <>
                                {detalhesCompletos.redes_sociais.outros.map((link: string, index: number) => (
                                  <TouchableOpacity
                                    key={index}
                                    style={styles.redeItem}
                                    onPress={() => {
                                      const url = link.startsWith('http') ? link : `https://${link}`;
                                      Linking.openURL(url).catch(() => Alert.alert('Erro', 'Link inválido'));
                                    }}
                                  >
                                    <Ionicons name="link-outline" size={20} color={Colors.tint} />
                                    <Text style={[styles.detalheValue, styles.linkText, { marginLeft: 8, flex: 1 }]}>
                                      {link}
                                    </Text>
                                  </TouchableOpacity>
                                ))}
                              </>
                            )}
                          </View>
                        </View>
                      )}
                    </>
                  )}
                </View>
              ) : (
                <Text style={styles.detalheValue}>Carregando...</Text>
              )}
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setModalDetalhes(false)}
              >
                <Text style={styles.modalButtonText}>Fechar</Text>
              </TouchableOpacity>
              {usuarioSelecionado && (
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                  onPress={() => {
                    setModalDetalhes(false);
                    setTimeout(() => abrirEditar(usuarioSelecionado), 300);
                  }}
                >
                  <Text style={[styles.modalButtonText, { color: Colors.card }]}>Editar</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Editar */}
      <Modal
        visible={modalEditar}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalEditar(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Editar {usuarioSelecionado?.tipo === 'paciente' ? 'Paciente' : 'Psicólogo'}
              </Text>
              <TouchableOpacity onPress={() => setModalEditar(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Nome *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.nome || ''}
                  onChangeText={(text) => setFormData({ ...formData, nome: text })}
                  placeholder="Nome completo"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Email *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.email || ''}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  placeholder="email@exemplo.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              
              {usuarioSelecionado?.tipo === 'paciente' ? (
                <>
                  <Text style={[styles.formLabel, { color: Colors.textSecondary, fontStyle: 'italic', marginTop: 8 }]}>
                    Nota: Dados pessoais dos pacientes não podem ser visualizados ou editados pelo administrador por questões de privacidade.
                  </Text>
                </>
              ) : (
                <>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>CRP</Text>
                    <TextInput
                      style={styles.formInput}
                      value={formData.crp || ''}
                      onChangeText={(text) => setFormData({ ...formData, crp: text })}
                      placeholder="CRP-XX/000000"
                    />
                  </View>
                  
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Especializações (separadas por vírgula)</Text>
                    <TextInput
                      style={styles.formInput}
                      value={formData.especializacoes || ''}
                      onChangeText={(text) => setFormData({ ...formData, especializacoes: text })}
                      placeholder="Ex: Ansiedade, Depressão, TDAH"
                      multiline
                    />
                  </View>
                  
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Bio</Text>
                    <TextInput
                      style={[styles.formInput, styles.formTextArea]}
                      value={formData.bio || ''}
                      onChangeText={(text) => setFormData({ ...formData, bio: text })}
                      placeholder="Biografia do psicólogo"
                      multiline
                      numberOfLines={4}
                    />
                  </View>
                  
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Foto de Perfil (URL)</Text>
                    <TextInput
                      style={styles.formInput}
                      value={formData.foto_perfil || ''}
                      onChangeText={(text) => setFormData({ ...formData, foto_perfil: text })}
                      placeholder="https://..."
                    />
                  </View>
                  
                  <View style={styles.formGroup}>
                    <View style={styles.switchRow}>
                      <Text style={styles.formLabel}>Disponível</Text>
                      <TouchableOpacity
                        style={[styles.switch, formData.disponivel && styles.switchAtivo]}
                        onPress={() => setFormData({ ...formData, disponivel: !formData.disponivel })}
                      >
                        <View style={[styles.switchThumb, formData.disponivel && styles.switchThumbAtivo]} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <View style={styles.formGroup}>
                    <View style={styles.switchRow}>
                      <Text style={styles.formLabel}>Perfil Completo</Text>
                      <TouchableOpacity
                        style={[styles.switch, formData.perfil_completo && styles.switchAtivo]}
                        onPress={() => setFormData({ ...formData, perfil_completo: !formData.perfil_completo })}
                      >
                        <View style={[styles.switchThumb, formData.perfil_completo && styles.switchThumbAtivo]} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <View style={styles.formGroup}>
                    <View style={styles.switchRow}>
                      <Text style={styles.formLabel}>Aprovado</Text>
                      <TouchableOpacity
                        style={[styles.switch, formData.aprovado && styles.switchAtivo]}
                        onPress={() => setFormData({ ...formData, aprovado: !formData.aprovado })}
                      >
                        <View style={[styles.switchThumb, formData.aprovado && styles.switchThumbAtivo]} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              )}
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setModalEditar(false)}
                disabled={salvando}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={salvarEdicao}
                disabled={salvando}
              >
                {salvando ? (
                  <ActivityIndicator size="small" color={Colors.card} />
                ) : (
                  <Text style={[styles.modalButtonText, { color: Colors.card }]}>Salvar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Excluir */}
      <Modal
        visible={modalExcluir}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalExcluir(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="warning-outline" size={48} color={Colors.destructive} />
              <Text style={styles.modalTitle}>Excluir Usuário</Text>
            </View>
            
            <Text style={styles.modalMessage}>
              Tem certeza que deseja excluir {usuarioSelecionado?.tipo === 'paciente' ? 'o paciente' : 'o psicólogo'}{' '}
              <Text style={styles.modalMessageBold}>{usuarioSelecionado?.nome}</Text>?
              {'\n\n'}
              Esta ação não pode ser desfeita.
            </Text>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setModalExcluir(false)}
                disabled={excluindo}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonDanger]}
                onPress={confirmarExclusao}
                disabled={excluindo}
              >
                {excluindo ? (
                  <ActivityIndicator size="small" color={Colors.card} />
                ) : (
                  <>
                    <Ionicons name="trash-outline" size={18} color={Colors.card} />
                    <Text style={[styles.modalButtonText, { color: Colors.card, marginLeft: 8 }]}>Excluir</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isSmallScreen = SCREEN_WIDTH < 360;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  filtrosContainer: {
    padding: 16,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filtrosRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  filtroButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  filtroButtonAtivo: {
    backgroundColor: Colors.tint,
    borderColor: Colors.tint,
  },
  filtroButtonText: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '500',
  },
  filtroButtonTextAtivo: {
    color: Colors.card,
    fontWeight: '600',
  },
  buscaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  buscaIcon: {
    marginRight: 8,
  },
  buscaInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text,
  },
  buscaClear: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  loader: {
    marginTop: 40,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeader: {
    marginBottom: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardNome: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  cardEmail: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: Colors.background,
  },
  badgePaciente: {
    backgroundColor: Colors.tint + '20',
  },
  badgePsicologo: {
    backgroundColor: Colors.headerBlue + '20',
  },
  badgeAprovado: {
    backgroundColor: '#4CAF50' + '20',
  },
  badgeDisponivel: {
    backgroundColor: '#2196F3' + '20',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  buttonVer: {
    backgroundColor: Colors.headerBlue,
  },
  buttonEditar: {
    backgroundColor: Colors.tint,
  },
  buttonExcluir: {
    backgroundColor: Colors.destructive,
  },
  actionButtonText: {
    color: Colors.card,
    fontSize: 13,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
  },
  modalBody: {
    padding: 20,
    maxHeight: 400,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  modalButtonSecondary: {
    backgroundColor: Colors.border,
  },
  modalButtonPrimary: {
    backgroundColor: Colors.tint,
  },
  modalButtonDanger: {
    backgroundColor: Colors.destructive,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  modalMessage: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  modalMessageBold: {
    fontWeight: '600',
    color: Colors.text,
  },
  detalheItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  detalheLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  detalheValue: {
    fontSize: 16,
    color: Colors.text,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
  },
  formTextArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  radioOption: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    alignItems: 'center',
  },
  radioOptionSelected: {
    backgroundColor: Colors.tint,
    borderColor: Colors.tint,
  },
  radioText: {
    fontSize: 14,
    color: Colors.text,
  },
  radioTextSelected: {
    color: Colors.card,
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    padding: 2,
  },
  switchAtivo: {
    backgroundColor: Colors.tint,
  },
  switchThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.card,
    alignSelf: 'flex-start',
  },
  switchThumbAtivo: {
    alignSelf: 'flex-end',
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  linkText: {
    color: Colors.tint,
    textDecorationLine: 'underline',
  },
  redesContainer: {
    marginTop: 8,
  },
  redeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});







