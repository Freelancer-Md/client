import React, { useState, useEffect } from 'react';
import axios from '../api/api';
import Layout from '../components/Layout';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';
import API from '../api/api';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('sales');
  const [sales, setSales] = useState([]);
  const [salespersons, setSalespersons] = useState([]);
  const [teamLeads, setTeamLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({
    from: '',
    to: '',
    team_lead_id: '',
    salesperson_id: ''
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });

  const { showToast, ToastContainer } = useToast();

  useEffect(() => {
    loadData();
  }, [activeTab, pagination.current, filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'sales') {
        await loadSales();
      } else if (activeTab === 'approvals') {
        await loadPendingSales();
      } else if (activeTab === 'salespersons') {
        await loadSalespersons();
        await loadTeamLeads();
      }
    } catch (error) {
      console.log(error)
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

const loadPendingSales = async () => {
  const params = new URLSearchParams({
    page: pagination.current,
    limit: 10,
    ...filters
  });

  const response = await API.get(`/sales?${params}`);
  const pendingSales = response.data.sales.filter(sale => sale.status !== 'approved');

  setSales(pendingSales);
  setPagination(response.data.pagination);
};

  const loadSalespersons = async () => {
    const response = await API.get('/salespersons');
    setSalespersons(response.data);
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

  const handleApproveSale = async (id) => {
    try {
      await API.put(`/sales/approve/${id}`);
      showToast('Sale approved successfully', 'success');
      loadData();
    } catch (error) {
      showToast('Error approving sale', 'error');
    }
  };

  const handleAssignSalesperson = async (salespersonId, teamLeadId) => {
    try {
      await API.put(`/salespersons/assign-to-tl/${salespersonId}`, {
        team_lead_id: teamLeadId
      });
      showToast('Salesperson reassigned successfully', 'success');
      loadData();
    } catch (error) {
      showToast('Error reassigning salesperson', 'error');
    }
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

  const handleAddTL = async (e) => {
    e.preventDefault();
    try {
      await API.post('/team-leads/add', formData);
      setShowModal(false);
      showToast('Team Lead added successfully', 'success');
      loadData();
    } catch (error) {
      showToast('Error adding team lead', 'error');
    }
  };

  const renderSalesTab = () => (
    <div>
      <div className="filter-bar">
        <div className="filter-group">
          <label className="form-label">From Date</label>
          <input
            type="date"
            name="from"
            value={filters.from}
            onChange={handleFilterChange}
            className="form-input"
          />
        </div>
        <div className="filter-group">
          <label className="form-label">To Date</label>
          <input
            type="date"
            name="to"
            value={filters.to}
            onChange={handleFilterChange}
            className="form-input"
          />
        </div>
        <div className="filter-group">
          <label className="form-label">Team Lead</label>
          <select
            name="team_lead_id"
            value={filters.team_lead_id}
            onChange={handleFilterChange}
            className="form-select"
          >
            <option value="">All Team Leads</option>
            {teamLeads.map(tl => (
              <option key={tl._id} value={tl._id}>{tl.name}</option>
            ))}
          </select>
        </div>
        <div className="filter-actions">
          <button onClick={clearFilters} className="btn btn-secondary">
            Clear
          </button>
          <button onClick={() => exportReport('csv')} className="btn btn-success">
            Export CSV
          </button>
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
                    <td>
                      <span className={`status-badge status-${sale.status}`}>
                        {sale.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={pagination.current}
            totalPages={pagination.pages}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );

const renderApprovalsTab = () => (
  <div>
    <h3 className="text-lg font-bold mb-2">Pending Approvals</h3>

    {loading ? (
      <div className="text-center p-3">
        <div className="spinner"></div>
      </div>
    ) : sales.length === 0 ? (
      <div className="text-center text-gray-500 p-3">
        No pending requests.
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
                  <td>
                    <span className={`status-badge status-${sale.status}`}>
                      {sale.status}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => handleApproveSale(sale._id)}
                      className="btn btn-success btn-sm"
                    >
                      Approve
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={pagination.current}
          totalPages={pagination.pages}
          onPageChange={handlePageChange}
        />
      </>
    )}
  </div>
);

  const renderSalespersonsTab = () => (
    <div>
      <div className="flex justify-between items-center mb-2" style={{padding: '5px'}}>
        <h3 className="text-lg font-bold">Team Lead Management</h3>
        <button
          onClick={() => {
            setModalType('add-tl');
            setShowModal(true);
          }}
          className="btn"
        >
          Add Team Lead
        </button>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Current Team Lead</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {salespersons.map(person => (
              <tr key={person._id}>
                <td>{person.name}</td>
                <td>{person.phone}</td>
                <td>{person.team_lead_id?.name}</td>
                <td>
                  <select
                    onChange={(e) => handleAssignSalesperson(person._id, e.target.value)}
                    className="form-select"
                    defaultValue={person.team_lead_id?._id || ''}
                  >
                    <option value="">Select Team Lead</option>
                    {teamLeads.map(tl => (
                      <option key={tl._id} value={tl._id}>{tl.name}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <Layout title="Admin Dashboard">
      <div className="dashboard-nav">
        <button
          className={`nav-tab ${activeTab === 'sales' ? 'active' : ''}`}
          onClick={() => setActiveTab('sales')}
        >
          All Sales
        </button>
        <button
          className={`nav-tab ${activeTab === 'approvals' ? 'active' : ''}`}
          onClick={() => setActiveTab('approvals')}
        >
          Pending Approvals
        </button>
        <button
          className={`nav-tab ${activeTab === 'salespersons' ? 'active' : ''}`}
          onClick={() => setActiveTab('salespersons')}
        >
          Team Management
        </button>
      </div>

      <div style={{ padding: '15px' }}>
        {activeTab === 'sales' && renderSalesTab()}
        {activeTab === 'approvals' && renderApprovalsTab()}
        {activeTab === 'salespersons' && renderSalespersonsTab()}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Team Lead">
        <form onSubmit={handleAddTL}>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="form-input"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="form-input"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="form-input"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="form-input"
              required
            />
          </div>
          <div className="modal-actions">
            <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn">
              Add
            </button>
          </div>
        </form>
      </Modal>

      <ToastContainer />
    </Layout>
  );
};

export default AdminDashboard;
