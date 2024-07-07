 // Variável para salvar a exibição atual do botão "Ocultar Equipamentos"
 var toggleButtonDisplay = '';

 document.addEventListener('DOMContentLoaded', function() {
     loadEquipments();
     loadEmployees();
     updateEmployeeSelect();
     
     function checkUpcomingMaintenance() {
        var equipments = getEquipments();
        var alertIcon = document.getElementById('alertIcon');
        
        // Verifica se o alertIcon está presente no DOM
        if (!alertIcon) {
            console.error('Elemento alertIcon não encontrado no DOM.');
            return;
        }
        
        // Verifica se há equipamentos com próxima manutenção em breve
        var isUpcomingMaintenance = equipments.some(function(equipmentItem) {
            return shouldHighlight(equipmentItem.proximaManutencao); // Verifica se está a três dias ou menos
        });
    
        // Exibe ou oculta o alertIcon com base na presença de manutenções próximas
        alertIcon.style.display = isUpcomingMaintenance ? 'inline' : 'none';
    
        // Atualiza o destaque visual dos equipamentos na lista
        equipments.forEach(function(equipmentItem) {
            var equipmentElements = document.getElementsByClassName('equipment-item');
            Array.from(equipmentElements).forEach(function(element) {
                var data = JSON.parse(element.getAttribute('data-equipment'));
                if (data.patrimonio === equipmentItem.patrimonio) {
                    if (shouldHighlight(equipmentItem.proximaManutencao)) {
                        element.classList.add('highlight');
                    } else {
                        element.classList.remove('highlight');
                    }
                }
            });
        });
    }
     


     // Botão para Mostrar/Ocultar Equipamentos
     document.getElementById('toggleButton').addEventListener('click', function() {
         var equipmentList = document.getElementById('equipmentList');
         checkUpcomingMaintenance();
         if (equipmentList.style.display === 'none' || equipmentList.style.display === '') {
             equipmentList.style.display = 'block';
             checkUpcomingMaintenance();
             this.textContent = 'Ocultar Equipamentos';
         } else {
             equipmentList.style.display = 'none';
             checkUpcomingMaintenance();
             this.textContent = 'Mostrar Equipamentos';
             
         }
     });

     // Botão para Cadastrar/Atualizar Equipamento
     document.getElementById('equipmentForm').addEventListener('submit', function(e) {
         e.preventDefault();
         console.log('Formulário enviado');
     
         var equipment = document.getElementById('equipment').value;
         var area = document.getElementById('area').value;
         var patrimonio = document.getElementById('patrimonio').value;
         var ultimaManutencao = document.getElementById('ultimaManutencaoInput').value;
         var proximaManutencao = document.getElementById('proximaManutencaoInput').value;
         var funcionario = document.getElementById('funcionario').value;
         var currentDateTime = new Date().toISOString();
     
         console.log({ equipment, area, patrimonio, ultimaManutencao, proximaManutencao, funcionario, currentDateTime });
     
         var equipmentItem = {
             equipment: equipment,
             area: area,
             patrimonio: patrimonio,
             ultimaManutencao: ultimaManutencao,
             proximaManutencao: proximaManutencao,
             funcionario: funcionario,
             dateTime: currentDateTime
         };
     
         // Verificar se as datas de manutenção estão preenchidas se ativadas
         if (document.getElementById('ativarProximaManutencao').checked && !proximaManutencao) {
             showAlert('Por favor, informe a data de Próxima Manutenção.', 'error');
             return;
         } 
         if (document.getElementById('ativarUltimaManutencao').checked && !ultimaManutencao) {
             showAlert('Por favor, informe a data de Última Manutenção.', 'error');
             return;
         }
     
         // Verificar se está editando um equipamento
         if (this.getAttribute('data-editing') === 'true') {
             console.log('Editando equipamento', equipmentItem);
             if (isValidMaintenanceDate(equipmentItem)) {
                 updateEquipmentInList(equipmentItem);
                 this.removeAttribute('data-editing');
                 resetEquipmentForm();
                 showAlert('Equipamento atualizado com sucesso', 'success');
             } else {
                 showAlert('A data de próxima manutenção não pode ser anterior ou igual à data da última manutenção.', 'error');
                 resetEquipmentForm();
             }
         } else {
             // Adicionar novo equipamento se não estiver editando
             if (!isPatrimonioDuplicate(patrimonio)) {
                 if (isValidMaintenanceDate(equipmentItem)) {
                     addEquipmentToList(equipmentItem);
                     saveEquipment(equipmentItem);
                     resetEquipmentForm();
                     showAlert('Equipamento cadastrado com sucesso.', 'success');
                 } else {
                     showAlert('A data de próxima manutenção não pode ser anterior ou igual à data da última manutenção.', 'error');
                     resetEquipmentForm();
                 }
             } else {
                 showAlert('Número de Patrimônio já cadastrado. Por favor, insira um número único.', 'error');
                 resetEquipmentForm();
             }
         }
     
         // Verificar se deve ocultar os campos de data de manutenção
         if (!isValidMaintenanceDate(equipmentItem)) {
             document.getElementById('ultimaManutencaoWrapper').style.display = 'none';
             document.getElementById('proximaManutencaoWrapper').style.display = 'none';
         }
         checkUpcomingMaintenance();
     });
     
 
     // Botão para Cancelar Edição
     document.getElementById('cancelButton').addEventListener('click', function(e) {
        e.preventDefault();
    
        var originalElement = document.getElementById('equipmentForm').getAttribute('data-original-element');
        if (originalElement) {
            var equipmentItem = JSON.parse(originalElement);
            addEquipmentToList(equipmentItem); // Adiciona o equipamento de volta à lista
            resetEquipmentForm(); // Restaura o formulário para o estado original
            showAlert('Edição cancelada com sucesso', 'info');
        } else {
            showAlert('Nenhum equipamento para cancelar a edição', 'error');
        }
    });
    

     // Botão para Gerenciar Funcionários
     document.getElementById('manageEmployeesButton').addEventListener('click', function() {
         document.getElementById('manageEmployeesModal').style.display = 'block';
     });
 
     // Fechar Modal de Gerenciar Funcionários
     document.querySelector('.close-button').addEventListener('click', function() {
         document.getElementById('manageEmployeesModal').style.display = 'none';
     });
 
     // Formulário para Cadastrar Funcionário
     document.getElementById('employeeForm').addEventListener('submit', function(e) {
         e.preventDefault();
     
         var employeeName = document.getElementById('employeeName').value;
         var employeeRegistro = document.getElementById('employeeRegistro').value;
     
         var employeeItem = {
             name: employeeName,
             registro: employeeRegistro
         };
     
         // Verificar duplicidade pelo número de registro
         if (isEmployeeDuplicate(employeeItem)) {
             showAlert('Este funcionário e/ou número de registro já está cadastrado.', 'error');
             return;
         } 
     
         addEmployeeToList(employeeItem);
         saveEmployee(employeeItem);
         updateEmployeeSelect();
         showAlert('Funcionário cadastrado com sucesso!', 'success');
     
         document.getElementById('employeeForm').reset();
     });
     
 
 function addEquipmentToList(equipmentItem) {
     var equipmentList = document.getElementById('equipmentList');
     var equipmentElement = createEquipmentElement(equipmentItem);
     equipmentList.appendChild(equipmentElement);
     console.log('Equipamento adicionado à lista', equipmentItem);
 }
 
 
 
 function createEquipmentElement(equipmentItem) {
     var equipmentElement = document.createElement('div');
     equipmentElement.className = 'equipment-item';
     if (shouldHighlight(equipmentItem.proximaManutencao)) {
        equipmentElement.classList.add('highlight');
    }

     equipmentElement.setAttribute('data-equipment', JSON.stringify(equipmentItem));
 
     var equipmentInfo = createEquipmentInfo(equipmentItem);
     var editButton = createButton('edit', 'Editar', function() {
         editEquipment(equipmentItem, equipmentElement);
     });
     var removeButton = createButton('remove', 'Remover', function() {
         removeEquipmentElement(equipmentElement, equipmentItem);
     });
 
     equipmentElement.appendChild(equipmentInfo);
     equipmentElement.appendChild(editButton);
     equipmentElement.appendChild(removeButton);                                                                         
 
     console.log('Elemento de equipamento criado:', equipmentItem); // Verifica se o elemento foi criado corretamente
     return equipmentElement;
 }
 


 function createEquipmentInfo(equipmentItem) {
     var equipmentInfo = document.createElement('div');
     equipmentInfo.innerHTML = `<strong>Equipamento:</strong> ${equipmentItem.equipment}<br>
                                <strong>Setor:</strong> ${equipmentItem.area}<br>
                                <strong>N.P:</strong> ${equipmentItem.patrimonio}<br>
                                <strong>Funcionário:</strong> ${equipmentItem.funcionario}<br><br>
                                <strong>Data de Cadastro:</strong> ${formatDateTime(equipmentItem.dateTime)}<br>
                                <strong>Última Manutenção:</strong> ${formatDateTime(equipmentItem.ultimaManutencao)}<br>
                                <strong>Próxima Manutenção:</strong> ${formatDate(equipmentItem.proximaManutencao)}`;
     return equipmentInfo;
 }
 
 function createButton(className, text, clickHandler) {
     var button = document.createElement('button');
     button.className = className;
     button.textContent = text;
     button.addEventListener('click', clickHandler);
     return button;
 }
 
 function removeEquipmentElement(equipmentElement, equipmentItem) {
     var equipmentList = document.getElementById('equipmentList');
     equipmentList.removeChild(equipmentElement);
     removeEquipment(equipmentItem);
     console.log('Equipamento removido', equipmentItem);
 }
 
 function saveEquipment(equipmentItem) {
     var equipments = getEquipments();
     equipments.push(equipmentItem);
     localStorage.setItem('equipments', JSON.stringify(equipments));
     console.log('Equipamento salvo no localStorage', equipmentItem);
     checkUpcomingMaintenance();
 }
 
 function getEquipments() {
     var equipments = localStorage.getItem('equipments');
     return equipments ? JSON.parse(equipments) : [];
 }
 
 function loadEquipments() {
     var equipments = getEquipments();
     equipments.forEach(function(equipmentItem) {
         addEquipmentToList(equipmentItem);
     });
     console.log('Equipamentos carregados do localStorage', equipments);
     checkUpcomingMaintenance();
 }
 
 function removeEquipment(equipmentItem) {
     var equipments = getEquipments();
     var updatedEquipments = equipments.filter(function(item) {
         return item.patrimonio !== equipmentItem.patrimonio;
     });
     localStorage.setItem('equipments', JSON.stringify(updatedEquipments));
     console.log('Equipamento removido do localStorage', equipmentItem);
     checkUpcomingMaintenance();
 }
 
 function editEquipment(equipmentItem, equipmentElement) {
    // Preencher formulário com os dados atuais do equipamento
    document.getElementById('equipment').value = equipmentItem.equipment;
    document.getElementById('area').value = equipmentItem.area;
    document.getElementById('patrimonio').value = equipmentItem.patrimonio;
    document.getElementById('ultimaManutencaoInput').value = equipmentItem.ultimaManutencao || '';
    document.getElementById('proximaManutencaoInput').value = equipmentItem.proximaManutencao || '';
    document.getElementById('funcionario').value = equipmentItem.funcionario;

    // Configurar formulário para modo de edição
    document.getElementById('equipmentForm').setAttribute('data-editing', "true");
    document.getElementById('equipmentForm').setAttribute('data-original-element', JSON.stringify(equipmentItem)); // Armazenar o elemento original para referência
    document.getElementById('submitButton').textContent = 'Atualizar Equipamento';

    // Exibir botão de cancelar e ocultar botão de mostrar/ocultar equipamentos
    document.getElementById('cancelButton').style.display = 'inline-block';
    document.getElementById('toggleButton').style.display = 'none';

    // Não remover o equipamento antigo da lista aqui
    removeEquipmentElement(equipmentElement, equipmentItem);
    checkUpcomingMaintenance();
}

 
function updateEquipmentInList(equipmentItem) {
    var equipments = getEquipments();
    var index = equipments.findIndex(function(item) {
        return item.patrimonio === equipmentItem.patrimonio;
    });

    if (index !== -1) {
        equipments[index] = equipmentItem;
    }

    localStorage.setItem('equipments', JSON.stringify(equipments));
    console.log('Equipamento atualizado no localStorage:', equipmentItem);

    var equipmentList = document.getElementById('equipmentList');
    var updatedElement = createEquipmentElement(equipmentItem); // Cria o novo elemento atualizado

    // Adiciona o elemento atualizado à lista
    equipmentList.appendChild(updatedElement);
    console.log('Elemento de equipamento atualizado visualmente:', equipmentItem);
    resetEquipmentForm();
    checkUpcomingMaintenance();
}
 
 function addEmployeeToList(employeeItem) {
     var employeeList = document.getElementById('employeeList');
     var employeeElement = document.createElement('div');
     employeeElement.className = 'employee-item';
     employeeElement.setAttribute('data-employee', JSON.stringify(employeeItem));
 
     var employeeInfo = document.createElement('div');
     employeeInfo.innerHTML = `<strong>Nome:</strong> ${employeeItem.name}<br>
                               <strong>Registro:</strong> ${employeeItem.registro}`;
 
     var removeButton = document.createElement('button');
     removeButton.textContent = 'Remover';
     removeButton.addEventListener('click', function() {
         removeEmployeeElement(employeeElement, employeeItem);
     });
 
     employeeElement.appendChild(employeeInfo);
     employeeElement.appendChild(removeButton);
     employeeList.appendChild(employeeElement);
 
     console.log('Funcionário adicionado à lista', employeeItem);
 }
 
 function removeEmployeeElement(employeeElement, employeeItem) {
     var employeeList = document.getElementById('employeeList');
     employeeList.removeChild(employeeElement);
     removeEmployee(employeeItem);
     console.log('Funcionário removido', employeeItem);
 }
 
 function saveEmployee(employeeItem) {
     var employees = getEmployees();
     employees.push(employeeItem);
     localStorage.setItem('employees', JSON.stringify(employees));
     console.log('Funcionário salvo no localStorage', employeeItem);
     checkUpcomingMaintenance();
 }
 
 function getEmployees() {
     var employees = localStorage.getItem('employees');
     return employees ? JSON.parse(employees) : [];
 }
 
 function loadEmployees() {
     var employees = getEmployees();
     employees.forEach(function(employeeItem) {
         addEmployeeToList(employeeItem);
     });
     console.log('Funcionários carregados do localStorage', employees);
 }
 
 function removeEmployee(employeeItem) {
     var employees = getEmployees();
     var updatedEmployees = employees.filter(function(item) {
         return item.registro !== employeeItem.registro;
     });
     localStorage.setItem('employees', JSON.stringify(updatedEmployees));
     console.log('Funcionário removido do localStorage', employeeItem);
 }
 
 function updateEmployeeSelect() {
     var select = document.getElementById('funcionario');
     select.innerHTML = '<option value="">Selecione o Funcionário...</option>';
     
     var employees = getEmployees();
     employees.forEach(function(employeeItem) {
         var option = document.createElement('option');
         option.value = employeeItem.name;
         option.textContent = employeeItem.name;
         select.appendChild(option);
     });
 }
 // Funçao de reset dos campos
 function resetEquipmentForm() {
    document.getElementById('equipment').value = '';
    document.getElementById('area').value = '';
    document.getElementById('patrimonio').value = '';
    document.getElementById('ultimaManutencaoInput').value = '';
    document.getElementById('proximaManutencaoInput').value = '';
    document.getElementById('ativarUltimaManutencao').checked = false; 
    document.getElementById('ativarProximaManutencao').checked = false; 
    document.getElementById('funcionario').value = '';
    document.getElementById('equipmentForm').removeAttribute('data-editing');
    document.getElementById('equipmentForm').removeAttribute('data-original-element');
    document.getElementById('submitButton').textContent = 'Adicionar Equipamento';
    document.getElementById('cancelButton').style.display = 'none';
    document.getElementById('toggleButton').style.display = 'inline-block';
    // Também oculte os campos de data de manutenção, se estiverem visíveis
    document.getElementById('ultimaManutencaoWrapper').style.display = 'none';
    document.getElementById('proximaManutencaoWrapper').style.display = 'none';
    checkUpcomingMaintenance();
}
 
 function showAlert(message, className) {
     var alertContainer = document.getElementById('alertContainer');
     if (!alertContainer) {
         console.error('Elemento #alertContainer não encontrado no DOM.');
         return;
     }
 
     var alertDiv = document.createElement('div');
     alertDiv.className = 'custom-alert ' + className;
     alertDiv.innerHTML = `
         ${message}
         <button class="close-btn" onclick="this.parentElement.style.display='none';">&times;</button>
     `;
 
     alertContainer.appendChild(alertDiv);
 
     setTimeout(function() {
         alertDiv.style.display = 'none';
     }, 3000);
 }
 
 
 function formatDateTime(dateTimeString) {
     var dateTime = new Date(dateTimeString);
     if (isNaN(dateTime.getTime())){
         return '';
     }
     return `${dateTime.toLocaleDateString()} ${dateTime.toLocaleTimeString()}`;
 }
 
 function formatDate(dateString) {
    var date = new Date(dateString);
    if (isNaN(date.getTime())){
        return '';
    }

    // Formata a data utilizando o método toLocaleDateString
    var formattedDate = date.toLocaleDateString('pt-BR', { timeZone: 'UTC' }); // Ajuste para seu fuso horário se necessário

    return formattedDate;
}

 
 function isPatrimonioDuplicate(patrimonio) {
     var equipments = getEquipments();
     return equipments.some(function(equipmentItem) {
         return equipmentItem.patrimonio.toLowerCase() === patrimonio.toLowerCase();
     });
 }
 
 function isValidMaintenanceDate(equipmentItem) {
     var ultimaManutencao = equipmentItem.ultimaManutencao ? new Date(equipmentItem.ultimaManutencao) : null;
     var proximaManutencao = equipmentItem.proximaManutencao ? new Date(equipmentItem.proximaManutencao) : null;
 
     // Verifica se a próxima manutenção é anterior ou igual à última manutenção
     if (ultimaManutencao && proximaManutencao) {
         return proximaManutencao > ultimaManutencao;
     }
 
     // Se uma das datas não estiver definida, considera válido
     return true;
 }
 

function shouldHighlight(proximaManutencao) {
    if (!proximaManutencao) return false;

    var today = new Date();
    var maintenanceDate = new Date(proximaManutencao);

    // Calcula a diferença em milissegundos
    var timeDiff = maintenanceDate - today;
    
    // Converte a diferença de milissegundos para dias
    var daysDiff = timeDiff / (1000 * 60 * 60 * 24);

    return daysDiff <= 3;
}

 function isEmployeeDuplicate(employeeItem) {
     var employees = getEmployees();
     return employees.some(function(item) {
         return item.registro.toLowerCase() === employeeItem.registro.toLowerCase() || item.name.toLowerCase() === employeeItem.name.toLowerCase();
     });
     
 
 }
 });
 function toggleUltimaManutencao(checkbox) {
     var ultimaManutencaoWrapper = document.getElementById('ultimaManutencaoWrapper');
     ultimaManutencaoWrapper.style.display = checkbox.checked ? 'block' : 'none';
 }
 function toggleProximaManutencao(checkbox) {
     var proximaManutencaoWrapper = document.getElementById('proximaManutencaoWrapper');
     proximaManutencaoWrapper.style.display = checkbox.checked ? 'block' : 'none';
 }
 
