import React, { useState, useEffect } from 'react';
import axios from '../api/api';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import { useToast } from '../components/Toast';
import API from '../api/api';

const SuperAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('sales');
  const [sales, setSales] = useState([]);
  const [salespersons, setSalespersons] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [teamLeads, setTeamLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({
    from: '',
    to: '',
    team_lead_id: '',
    salesperson_id: ''
  });
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);

  const { showToast, ToastContainer } = useToast();

  useEffect(() => {
    loadData();
  }, [activeTab, pagination.current, filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'sales') {
        await loadSales();
      } else if (activeTab === 'salespersons') {
        await loadSalespersons();
        await loadTeamLeads();
      } else if (activeTab === 'admins') {
        await loadAdmins();
        await loadTeamLeads();
      }
    } catch (error) {
      showToast('Error loading data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadSales = async () => {
    const params = new URLSearchParams({
      page: pagination.current,
      limit: 10,
      ...filters
    });

    const response = await API.get(`/sales?${params}`);
    setSales(response.data.sales);
    setPagination(response.data.pagination);
  };

  const loadSalespersons = async () => {
    const response = await API.get('/salespersons');
    setSalespersons(response.data);
  };

  const loadAdmins = async () => {
    const response = await API.get('/admins');
    setAdmins(response.data);
  };

  const loadTeamLeads = async () => {
    const response = await API.get('/salespersons/team-leads');
    setTeamLeads(response.data);
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
    setPagination({ ...pagination, current: 1 });
  };

  const clearFilters = () => {
    setFilters({
      from: '',
      to: '',
      team_lead_id: '',
      salesperson_id: ''
    });
    setPagination({ ...pagination, current: 1 });
  };

  const handlePageChange = (page) => {
    setPagination({ ...pagination, current: page });
  };

  const handleDeleteSale = async (id) => {
    if (window.confirm('Are you sure you want to delete this sale?')) {
      try {
        await API.delete(`/sales/delete/${id}`);
        showToast('Sale deleted successfully', 'success');
        loadData();
      } catch (error) {
        showToast('Error deleting sale', 'error');
      }
    }
  };

  const handleApproveSale = async (id) => {
    try {
      await API.put(`/sales/approve/${id}`);
      showToast('Sale approved successfully', 'success');
      loadData();
    } catch (error) {
      showToast('Error approving sale', 'error');
    }
  };

  const openModal = (type, item = null) => {
    setModalType(type);
    setSelectedItem(item);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalType('');
    setSelectedItem(null);
  };

  const exportReport = async (format = 'csv') => {
    try {
      const params = new URLSearchParams(filters);
      params.append('format', format);

      const response = await API.get(`/reports/export?${params}`, {
        responseType: format === 'csv' ? 'blob' : 'json'
      });

      if (format === 'csv') {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'sales_report.csv');
        document.body.appendChild(link);
        link.click();
        link.remove();
        showToast('Report exported successfully', 'success');
      }
    } catch (error) {
      showToast('Error exporting report', 'error');
    }
  };

  const renderSalesTab = () => (
    <div>
      <div className="filter-bar">
        <div className="filter-group">
          <label className="form-label">From Date</label>
          <input type="date" name="from" value={filters.from} onChange={handleFilterChange} className="form-input" />
        </div>
        <div className="filter-group">
          <label className="form-label">To Date</label>
          <input type="date" name="to" value={filters.to} onChange={handleFilterChange} className="form-input" />
        </div>
        <div className="filter-group">
          <label className="form-label">Team Lead</label>
          <select name="team_lead_id" value={filters.team_lead_id} onChange={handleFilterChange} className="form-select">
            <option value="">All Team Leads</option>
            {teamLeads.map(tl => (
              <option key={tl._id} value={tl._id}>{tl.name}</option>
            ))}
          </select>
        </div>
        <div className="filter-actions">
          <button onClick={clearFilters} className="btn btn-secondary">Clear</button>
          <button onClick={() => exportReport('csv')} className="btn btn-success">Export CSV</button>
        </div>
      </div>

      {loading ? (
        <div className="text-center p-3">
          <div className="spinner"></div>
        </div>
      ) : (
        <>
          <div className="card">
            <table className="table">
              <thead>
                <tr>
                  <th>Policy Number</th>
                  <th>Vehicle Number</th>
                  <th>Salesperson</th>
                  <th>Team Lead</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sales.map(sale => (
                  <tr key={sale._id}>
                    <td>{sale.policy_number}</td>
                    <td>{sale.vehicle_number}</td>
                    <td>{sale.salesperson_id?.name}</td>
                    <td>{sale.team_lead_id?.name}</td>
                    <td>{new Date(sale.date).toLocaleDateString()}</td>
                    <td><span className={`status-badge status-${sale.status}`}>{sale.status}</span></td>
                    <td>
                      <div className="flex gap-1">
                        {sale.status === 'pending' && (
                          <button onClick={() => handleApproveSale(sale._id)} className="btn btn-success btn-sm">Approve</button>
                        )}
                        <button onClick={() => handleDeleteSale(sale._id)} className="btn btn-danger btn-sm">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination currentPage={pagination.current} totalPages={pagination.pages} onPageChange={handlePageChange} />
        </>
      )}
    </div>
  );

  const renderSalespersonsTab = () => (
    <div>
      <div className="flex justify-between items-center mb-2" style={{padding: '5px'}}>
        <h3 className="text-lg font-bold">Salespersons Management</h3>
        <button onClick={() => openModal('add-admin')} className="btn">Add Admin</button>
      </div>
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Team Lead</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {salespersons.map(person => (
              <tr key={person._id}>
                <td>{person.name}</td>
                <td>{person.phone}</td>
                <td>{person.team_lead_id?.name}</td>
                <td>{new Date(person.created_at).toLocaleDateString()}</td>
                <td>
                  <div className="flex gap-1">
                    <button onClick={() => openModal('assign-tl', person)} className="btn btn-warning btn-sm">Reassign</button>
                    <button onClick={() => handleDeleteSalesperson(person._id)} className="btn btn-danger btn-sm">Remove</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAdminsTab = () => (
    <div>
      <div className="flex justify-between items-center mb-2" style={{padding: '5px'}}>
        <h3 className="text-lg font-bold">Admin Management</h3>
        <div className="flex gap-2">
          <button onClick={() => openModal('add-admin')} className="btn">Add Admin</button>
          <button onClick={() => openModal('add-tl')} className="btn btn-secondary">Add Team Lead</button>
        </div>
      </div>

      {/* Admins Table */}
      <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
        <div className="card overflow-x-auto mb-6" style={{padding: '15px'}}>
          <h4 className="text-md font-semibold mb-2">Admins</h4>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map(admin => (
                <tr key={admin._id}>
                  <td>{admin.name}</td>
                  <td>{admin.email}</td>
                  <td>{admin.phone}</td>
                  <td>{new Date(admin.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="flex gap-1">
                      <button className="btn btn-danger btn-sm">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Team Leads Table */}
        <div className="card overflow-x-auto" style={{padding: '15px'}}>
          <h4 className="text-md font-semibold mb-2">Team Leads</h4>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {teamLeads.map(tl => (
                <tr key={tl._id}>
                  <td>{tl.name}</td>
                  <td>{tl.email}</td>
                  <td>{tl.phone}</td>
                  <td>{new Date(tl.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="flex gap-1">
                      <button className="btn btn-danger btn-sm">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const handleDeleteSalesperson = async (id) => {
    if (window.confirm('Are you sure you want to remove this salesperson?')) {
      try {
        await API.delete(`/salespersons/remove/${id}`);
        showToast('Salesperson removed successfully', 'success');
        loadData();
      } catch (error) {
        showToast('Error removing salesperson', 'error');
      }
    }
  };

  return (
    <Layout title="Super Admin Dashboard" >
      <div className="dashboard-nav">
        <button className={`nav-tab ${activeTab === 'sales' ? 'active' : ''}`} onClick={() => setActiveTab('sales')}>Sales Management</button>
        <button className={`nav-tab ${activeTab === 'admins' ? 'active' : ''}`} onClick={() => setActiveTab('admins')}>Admin Management</button>
      </div>

      <div style={{ padding: '15px' }}>
        {activeTab === 'sales' && renderSalesTab()}
        {activeTab === 'salespersons' && renderSalespersonsTab()}
        {activeTab === 'admins' && renderAdminsTab()}
      </div>


      <SalespersonModal
        isOpen={showModal}
        onClose={closeModal}
        type={modalType}
        item={selectedItem}
        teamLeads={teamLeads}
        onSuccess={() => {
          closeModal();
          loadData();
          showToast('Operation completed successfully', 'success');
        }}
      />

      <ToastContainer />
    </Layout>
  );
};

const SalespersonModal = ({ isOpen, onClose, type, item, teamLeads, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    team_lead_id: ''
  });

  useEffect(() => {
    if (type === 'assign-tl' && item) {
      setFormData({
        name: item.name,
        phone: item.phone,
        email: '',
        password: '',
        team_lead_id: item.team_lead_id?._id || ''
      });
    } else {
      setFormData({ name: '', phone: '', email: '', password: '', team_lead_id: '' });
    }
  }, [type, item]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (type === 'add-salesperson') {
        await API.post('/salespersons/add', formData);
      } else if (type === 'assign-tl') {
        await API.put(`/salespersons/assign-to-tl/${item._id}`, { team_lead_id: formData.team_lead_id });
      } else if (type === 'add-admin') {
        await API.post('/admins/add', {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password
        });
      } else if (type === 'add-tl') {
        await API.post('/team-leads/add', {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password
        });
      }
      onSuccess();
    } catch (error) {
      console.error('Modal operation error:', error);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        type === 'add-salesperson'
          ? 'Add Salesperson'
          : type === 'add-admin'
            ? 'Add Admin'
            : type === 'add-tl'
              ? 'Add Team Lead'
              : 'Reassign Team Lead'
      }
    >
      <form onSubmit={handleSubmit}>
        {(type === 'add-salesperson' || type === 'add-admin' || type === 'add-tl') && (
          <>
            <div className="form-group">
              <label className="form-label">Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="form-input" required />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="form-input" required />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="form-input" required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" name="password" value={formData.password} onChange={handleInputChange} className="form-input" required />
            </div>
          </>
        )}


        {type === 'assign-tl' && (
          <div className="form-group">
            <label className="form-label">Team Lead</label>
            <select name="team_lead_id" value={formData.team_lead_id} onChange={handleInputChange} className="form-select" required>
              <option value="">Select Team Lead</option>
              {teamLeads.map(tl => (
                <option key={tl._id} value={tl._id}>{tl.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="modal-actions">
          <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
          <button type="submit" className="btn">
            {type === 'add-salesperson'
              ? 'Add'
              : type === 'add-admin'
                ? 'Add'
                : 'Reassign'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default SuperAdminDashboard;