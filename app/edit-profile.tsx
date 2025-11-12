
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import { useAuth } from './contexts/AuthContext';
import { updatePacienteMe, updatePsicologoMe, getPacienteMe, getPsicologoMe } from '../lib/api';
import AppHeader from '../components/AppHeader';


export default function EditarPerfilScreen() {
  const router = useRouter();
  const { user, token, updateUser } = useAuth();
  const [nome, setNome] = useState(user?.nome || '');
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);
  const [preferencia, setPreferencia] = useState<'WhatsApp' | 'Telegram' | 'Discord'>('WhatsApp');
  const [contato, setContato] = useState('');
  const [bio, setBio] = useState('');
  const [crp, setCrp] = useState('');
  const [telefone, setTelefone] = useState('');
  
  // Campos de redes sociais (para psicólogo)
  const [instagram, setInstagram] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [facebook, setFacebook] = useState('');
  const [outrosLinks, setOutrosLinks] = useState<string[]>(['']);
  
  // Campos de links de comunicação (para paciente)
  const [linkWhatsapp, setLinkWhatsapp] = useState('');
  const [linkTelegram, setLinkTelegram] = useState('');
  const [linkDiscord, setLinkDiscord] = useState('');
  const [linkEmail, setLinkEmail] = useState('');
  
  // Carregar dados do paciente ou psicólogo ao abrir a tela
  useEffect(() => {
    if (!user || !token) return;
    
    (async () => {
      try {
        if (user.role === 'paciente') {
          const dados = await getPacienteMe(token);
          setNome(dados.nome || '');
          setEmail(dados.email || '');
          setPreferencia(dados.preferencia_comunicacao || 'WhatsApp');
          setContato(dados.contato_preferido || '');
          setLinkWhatsapp(dados.link_whatsapp || '');
          setLinkTelegram(dados.link_telegram || '');
          setLinkDiscord(dados.link_discord || '');
          setLinkEmail(dados.link_email || '');
          setTelefone(dados.telefone || '');
        } else if (user.role === 'psicologo') {
          const dados = await getPsicologoMe(token);
          setNome(dados.nome || '');
          setEmail(dados.email || '');
          
          // Formatar CRP ao carregar (se vier sem formatação, adiciona)
          const crpCarregado = dados.crp || '';
          let crpFormatado = '';
          if (crpCarregado) {
            const numeros = crpCarregado.replace(/\D/g, '');
            if (numeros.length >= 8) {
              crpFormatado = `${numeros.slice(0, 2)}/${numeros.slice(2)}`;
            } else {
              crpFormatado = crpCarregado; // Mantém como está se não tiver 8 dígitos
            }
          }
          setCrp(crpFormatado);
          
          setBio(dados.bio || '');
          setTelefone(dados.telefone || '');
          
          // Carregar redes sociais
          const redes = dados.redes_sociais || {};
          setInstagram(redes.instagram || '');
          setLinkedin(redes.linkedin || '');
          setFacebook(redes.facebook || '');
          setOutrosLinks(redes.outros && Array.isArray(redes.outros) && redes.outros.length > 0 
            ? redes.outros 
            : ['']);
        }
      } catch (e) {
        console.error('Erro ao carregar dados:', e);
      }
    })();
  }, [user, token]);

  // Atualização do contexto após salvar (forçando recarregar o perfil)
  const handleSalvar = async () => {
    console.log('🟢 [EDIT-PROFILE] handleSalvar chamado');
    console.log('🟢 [EDIT-PROFILE] user:', user?.id, user?.role);
    console.log('🟢 [EDIT-PROFILE] token presente:', !!token);
    
    if (!user || !token) {
      console.error('❌ [EDIT-PROFILE] User ou token ausente');
      Alert.alert('Erro', 'Você precisa estar autenticado para salvar.');
      return;
    }
    
    // Validação de campos obrigatórios
    const camposFaltando: string[] = [];
    
    if (!nome || !nome.trim()) {
      camposFaltando.push('Nome');
    }
    if (!email || !email.trim()) {
      camposFaltando.push('Email');
    }
    if (user.role === 'psicologo') {
      const crpLimpo = crp.replace(/\D/g, '');
      if (!crp || !crp.trim() || crpLimpo.length < 8) {
        camposFaltando.push('CRP (formato: XX/XXXXXX)');
      }
    }
    
    if (camposFaltando.length > 0) {
      Alert.alert(
        'Campos obrigatórios',
        `Por favor, preencha os seguintes campos:\n\n• ${camposFaltando.join('\n• ')}`,
        [{ text: 'OK' }]
      );
      return;
    }
    
    setLoading(true);
    try {
      if (user.role === 'psicologo') {
        console.log('📝 [EDIT-PROFILE] Atualizando psicólogo...');
        
        // Preparar redes sociais
        const redesSociais: any = {};
        if (instagram && instagram.trim()) redesSociais.instagram = instagram.trim();
        if (linkedin && linkedin.trim()) redesSociais.linkedin = linkedin.trim();
        if (facebook && facebook.trim()) redesSociais.facebook = facebook.trim();
        const outrosFiltrados = outrosLinks.filter(link => link && link.trim() !== '');
        if (outrosFiltrados.length > 0) redesSociais.outros = outrosFiltrados;
        
        // Preparar dados para envio
        // Remover formatação do CRP antes de salvar (apenas números)
        const crpLimpo = crp ? crp.replace(/\D/g, '') : null;
        
        const dadosParaEnviar: any = { 
          nome: nome.trim(), 
          email: email.trim(), 
          crp: crpLimpo && crpLimpo.length >= 8 ? crpLimpo : null, 
          bio: bio ? bio.trim() : null,
          telefone: telefone && telefone.trim() ? telefone.trim() : null
        };
        
        // Só adiciona redes_sociais se houver pelo menos uma rede social
        if (Object.keys(redesSociais).length > 0) {
          dadosParaEnviar.redes_sociais = redesSociais;
        }
        
        console.log('📤 [EDIT-PROFILE] Dados para enviar:', dadosParaEnviar);
        
        await updatePsicologoMe(dadosParaEnviar, token);
        updateUser({ id: user.id, nome, email });
      } else {
        console.log('📝 [EDIT-PROFILE] Atualizando paciente...');
        const dadosParaSalvar = { 
          nome,
          email,
          preferencia_comunicacao: preferencia, 
          contato_preferido: contato,
          link_whatsapp: linkWhatsapp,
          link_telegram: linkTelegram,
          link_discord: linkDiscord,
          link_email: linkEmail,
          telefone: telefone
        };
        console.log('📝 [EDIT-PROFILE] Dados para salvar:', dadosParaSalvar);
        await updatePacienteMe(dadosParaSalvar, token);
        console.log('✅ [EDIT-PROFILE] Perfil atualizado com sucesso!');
        updateUser({ id: user.id, nome, email });
      }
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
      router.replace('/(tabs)/perfil');
    } catch (error: any) {
      console.error('❌ [EDIT-PROFILE] ====== ERRO AO ATUALIZAR PERFIL ======');
      console.error('❌ [EDIT-PROFILE] Erro completo:', error);
      console.error('❌ [EDIT-PROFILE] Erro message:', error?.message);
      console.error('❌ [EDIT-PROFILE] Erro response:', error?.response);
      console.error('❌ [EDIT-PROFILE] Erro response status:', error?.response?.status);
      console.error('❌ [EDIT-PROFILE] Erro response data:', error?.response?.data);
      console.error('❌ [EDIT-PROFILE] Erro stack:', error?.stack);
      
      let mensagemErro = 'Erro ao atualizar perfil.';
      
      if (error?.response?.data?.erro) {
        mensagemErro = error.response.data.erro;
      } else if (error?.message) {
        mensagemErro = error.message;
      }
      
      // Mensagem específica para erro de coluna não encontrada
      if (mensagemErro.includes('Unknown column') || mensagemErro.includes('telefone') || mensagemErro.includes('redes_sociais')) {
        mensagemErro = 'Erro: Os campos telefone ou redes_sociais não existem no banco de dados.\n\nPor favor, execute o script SQL:\nPsicoCare-API/src/scripts/ADICIONAR_CAMPOS_PSICOLOGO.sql';
      }
      
      Alert.alert('Erro ao Salvar', mensagemErro);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 24 }}>
      <AppHeader title="Editar Perfil" subtitle="Atualize suas informações" />
      <TextInput
        style={styles.input}
        placeholder="Nome"
        value={nome}
        onChangeText={setNome}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      {user?.role !== 'psicologo' && (
        <>
          <Text style={{ color: Colors.text, marginBottom: 6, fontWeight: '600' }}>Preferência de comunicação</Text>
          <View style={{ flexDirection: 'row', marginBottom: 12 }}>
            {(['WhatsApp','Telegram','Discord'] as const).map((p) => (
              <TouchableOpacity key={p} onPress={() => setPreferencia(p)} style={{ paddingVertical: 6, paddingHorizontal: 10, borderWidth: 1, borderColor: Colors.border, borderRadius: 20, marginRight: 6, backgroundColor: preferencia===p?Colors.tint:Colors.card }}>
                <Text style={{ color: preferencia===p?Colors.card:Colors.text }}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput style={styles.input} placeholder="Contato preferido (legado)" value={contato} onChangeText={setContato} />
          
          <Text style={{ color: Colors.text, marginBottom: 6, marginTop: 8, fontWeight: '600' }}>Links de Comunicação</Text>
          <Text style={{ color: Colors.textSecondary, fontSize: 12, marginBottom: 8 }}>
            Adicione seus links ou números de contato. Para números de telefone, apenas o número (ex: 5511999999999).
          </Text>
          
          <TextInput 
            style={styles.input} 
            placeholder="WhatsApp (número ou link)" 
            value={linkWhatsapp} 
            onChangeText={setLinkWhatsapp}
            keyboardType="default"
          />
          <TextInput 
            style={styles.input} 
            placeholder="Telegram (usuário ou link)" 
            value={linkTelegram} 
            onChangeText={setLinkTelegram}
            keyboardType="default"
          />
          <TextInput 
            style={styles.input} 
            placeholder="Discord (usuário ou link)" 
            value={linkDiscord} 
            onChangeText={setLinkDiscord}
            keyboardType="default"
          />
          <TextInput 
            style={styles.input} 
            placeholder="Email adicional (opcional)" 
            value={linkEmail} 
            onChangeText={setLinkEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Text style={{ color: Colors.text, marginBottom: 6, marginTop: 8, fontWeight: '600' }}>Telefone</Text>
          <Text style={{ color: Colors.textSecondary, fontSize: 12, marginBottom: 8 }}>
            Apenas números (ex: 11999999999)
          </Text>
          <TextInput 
            style={styles.input} 
            placeholder="Telefone (ex: 11999999999)" 
            value={telefone} 
            onChangeText={(text) => {
              // Remove tudo que não é número
              const numeros = text.replace(/\D/g, '');
              // Limita a 15 dígitos (tamanho máximo de telefone internacional)
              const limitado = numeros.slice(0, 15);
              setTelefone(limitado);
            }}
            keyboardType="phone-pad"
            maxLength={15}
          />
        </>
      )}

      {user?.role === 'psicologo' && (
        <>
          <Text style={{ color: Colors.text, marginBottom: 6, fontWeight: '600' }}>CRP</Text>
          <Text style={{ color: Colors.textSecondary, fontSize: 12, marginBottom: 8 }}>
            Formato: XX/XXXXXX (ex: 06/123456)
          </Text>
          <TextInput 
            style={styles.input} 
            placeholder="CRP (ex: 06/123456)" 
            value={crp} 
            onChangeText={(text) => {
              // Remove tudo que não é número
              const numeros = text.replace(/\D/g, '');
              
              // Limita a 8 dígitos (2 para região + 6 para número)
              const limitado = numeros.slice(0, 8);
              
              // Formata: XX/XXXXXX
              let formatado = '';
              if (limitado.length > 0) {
                if (limitado.length <= 2) {
                  formatado = limitado;
                } else {
                  formatado = `${limitado.slice(0, 2)}/${limitado.slice(2)}`;
                }
              }
              
              setCrp(formatado);
            }}
            keyboardType="numeric"
            maxLength={9} // 2 dígitos + 1 barra + 6 dígitos = 9 caracteres
          />
          <TextInput style={[styles.input, { height: 100 }]} placeholder="Bio" value={bio} onChangeText={setBio} multiline />
          
          <Text style={{ color: Colors.text, marginBottom: 6, marginTop: 8, fontWeight: '600' }}>Telefone</Text>
          <Text style={{ color: Colors.textSecondary, fontSize: 12, marginBottom: 8 }}>
            Apenas números (ex: 11999999999)
          </Text>
          <TextInput 
            style={styles.input} 
            placeholder="Telefone (ex: 11999999999)" 
            value={telefone} 
            onChangeText={(text) => {
              // Remove tudo que não é número
              const numeros = text.replace(/\D/g, '');
              // Limita a 15 dígitos (tamanho máximo de telefone internacional)
              const limitado = numeros.slice(0, 15);
              setTelefone(limitado);
            }}
            keyboardType="phone-pad"
            maxLength={15}
          />
          
          <Text style={{ color: Colors.text, marginBottom: 6, marginTop: 8, fontWeight: '600' }}>Redes Sociais</Text>
          <Text style={{ color: Colors.textSecondary, fontSize: 12, marginBottom: 8 }}>
            Adicione links das suas redes sociais para que pacientes possam encontrá-lo.
          </Text>
          
          <TextInput 
            style={styles.input} 
            placeholder="Instagram (link ou @usuario)" 
            value={instagram} 
            onChangeText={setInstagram}
            keyboardType="default"
            autoCapitalize="none"
          />
          <TextInput 
            style={styles.input} 
            placeholder="LinkedIn (link)" 
            value={linkedin} 
            onChangeText={setLinkedin}
            keyboardType="default"
            autoCapitalize="none"
          />
          <TextInput 
            style={styles.input} 
            placeholder="Facebook (link)" 
            value={facebook} 
            onChangeText={setFacebook}
            keyboardType="default"
            autoCapitalize="none"
          />
          
          <Text style={{ color: Colors.text, marginBottom: 6, marginTop: 8, fontSize: 14 }}>Outros Links</Text>
          {outrosLinks.map((link, index) => (
            <View key={index} style={{ flexDirection: 'row', marginBottom: 8 }}>
              <TextInput 
                style={[styles.input, { flex: 1, marginRight: 8 }]} 
                placeholder={`Outro link ${index + 1} (opcional)`} 
                value={link} 
                onChangeText={(text) => {
                  const novos = [...outrosLinks];
                  novos[index] = text;
                  setOutrosLinks(novos);
                }}
                keyboardType="default"
                autoCapitalize="none"
              />
              {outrosLinks.length > 1 && (
                <TouchableOpacity 
                  style={{ 
                    backgroundColor: Colors.destructive, 
                    padding: 12, 
                    borderRadius: 8, 
                    justifyContent: 'center',
                    alignItems: 'center',
                    minWidth: 50
                  }}
                  onPress={() => {
                    const novos = outrosLinks.filter((_, i) => i !== index);
                    setOutrosLinks(novos.length > 0 ? novos : ['']);
                  }}
                >
                  <Text style={{ color: Colors.card, fontWeight: '600' }}>×</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
          {outrosLinks.length < 5 && (
            <TouchableOpacity 
              style={{ 
                backgroundColor: Colors.cardAlt, 
                padding: 12, 
                borderRadius: 8, 
                borderWidth: 1, 
                borderColor: Colors.border,
                alignItems: 'center',
                marginBottom: 16
              }}
              onPress={() => setOutrosLinks([...outrosLinks, ''])}
            >
              <Text style={{ color: Colors.tint, fontWeight: '600' }}>+ Adicionar outro link</Text>
            </TouchableOpacity>
          )}
        </>
      )}
      
      {/* Botões de ação */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity 
          style={[styles.cancelButton, loading && { opacity: 0.5 }]} 
          onPress={() => router.back()} 
          disabled={loading}
          activeOpacity={0.7}
        >
          <Ionicons name="close-outline" size={20} color={Colors.text} />
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.saveButton, loading && { opacity: 0.5 }]} 
          onPress={() => {
            console.log('🔵 [EDIT-PROFILE] Botão Salvar clicado!');
            console.log('🔵 [EDIT-PROFILE] Loading:', loading);
            console.log('🔵 [EDIT-PROFILE] User:', user?.id);
            console.log('🔵 [EDIT-PROFILE] Token:', !!token);
            handleSalvar();
          }} 
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="small" color={Colors.card} style={{ marginRight: 8 }} />
          ) : (
            <Ionicons name="checkmark-circle-outline" size={20} color={Colors.card} style={{ marginRight: 8 }} />
          )}
          <Text style={styles.saveButtonText}>{loading ? 'Salvando...' : 'Salvar'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  input: {
    backgroundColor: Colors.cardAlt,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.text,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 24,
  },
  saveButton: {
    flex: 1,
    backgroundColor: Colors.tint,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    color: Colors.card,
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Colors.cardAlt,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});
