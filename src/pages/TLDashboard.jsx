import React, { useState, useEffect } from 'react';
import axios from '../utils/axios'; // use your custom instance
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import { useToast } from '../components/Toast';
import API from '../utils/api'; // Adjust path as needed

const TLDashboard = () => {
  const [activeTab, setActiveTab] = useState('sales');
  const [sales, setSales] = useState([]);
  const [salespersons, setSalespersons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({
    from: '',
    to: '',
    salesperson_id: ''
  });
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedSale, setSelectedSale] = useState(null);

  const { showToast, ToastContainer } = useToast();

  useEffect(() => {
    loadData();
  }, [activeTab, pagination.current, filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'sales') {
        await loadSales(); // includes salespersons now
      } else if (activeTab === 'team') {
        await loadSalespersons(); // still needed separately when on "team"
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

    const [salesRes, salespersonsRes] = await Promise.all([
      API.get(`/api/sales?${params}`),
      API.get('/api/salespersons')
    ]);

    setSales(salesRes.data.sales);
    setPagination(salesRes.data.pagination);
    setSalespersons(salespersonsRes.data);
  };

  const loadSalespersons = async () => {
    const response = await API.get('/api/salespersons');
    setSalespersons(response.data);
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
      salesperson_id: ''
    });
    setPagination({ ...pagination, current: 1 });
  };

  const handlePageChange = (page) => {
    setPagination({ ...pagination, current: page });
  };

  const openModal = (type, sale = null) => {
    setModalType(type);
    setSelectedSale(sale);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalType('');
    setSelectedSale(null);
  };

  const handleEditSale = async (id) => {
    try {
      await API.put(`/api/sales/edit/${id}`);
      showToast('Sale updated successfully', 'success');
      loadData();
    } catch (error) {
      showToast('Error updating sale', 'error');
    }
  };

  const exportReport = async (format = 'csv') => {
    try {
      const params = new URLSearchParams(filters);
      params.append('format', format);

      const response = await API.get(`/api/reports/export?${params}`, {
        responseType: format === 'csv' ? 'blob' : 'json'
      });

      if (format === 'csv') {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'team_sales_report.csv');
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
      <div className="flex justify-between items-center mb-2" style={{ padding: '15px' }}>
        <h3 className="text-lg font-bold">Team Sales</h3>
        <button
          onClick={() => openModal('add-sale')}
          className="btn"
        >
          Add Sale
        </button>
      </div>

      <div className="filter-bar" style={{ padding: '15px' }}>
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
          <label className="form-label">Salesperson</label>
          <select
            name="salesperson_id"
            value={filters.salesperson_id}
            onChange={handleFilterChange}
            className="form-select"
          >
            <option value="">All Salespersons</option>
            {salespersons.map(person => (
              <option key={person._id} value={person._id}>{person.name}</option>
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
                    <td>{new Date(sale.date).toLocaleDateString()}</td>
                    <td>
                      <span className={`status-badge status-${sale.status}`}>
                        {sale.status}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => openModal('edit-sale', sale)}
                        className="btn btn-secondary btn-sm"
                      >
                        Edit
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

  const renderTeamTab = () => (
    <div>
      <div className="flex justify-between items-center mb-2" style={{padding: '5px'}}>
        <h3 className="text-lg font-bold">Team Members</h3>
        <button
          onClick={() => openModal('add-salesperson')}
          className="btn"
        >
          Add Team Member
        </button>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {salespersons.map(person => (
              <tr key={person._id}>
                <td>{person.name}</td>
                <td>{person.phone}</td>
                <td>{new Date(person.created_at).toLocaleDateString()}</td>
                <td>
                  <button
                    onClick={() => handleRemoveSalesperson(person._id)}
                    className="btn btn-danger btn-sm"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const handleRemoveSalesperson = async (id) => {
    if (window.confirm('Are you sure you want to remove this team member?')) {
      try {
        await API.delete(`/api/salespersons/remove/${id}`);
        showToast('Team member removed successfully', 'success');
        loadData();
      } catch (error) {
        showToast('Error removing team member', 'error');
      }
    }
  };

  return (
    <Layout title="Team Lead Dashboard">
      <div className="dashboard-nav">
        <button
          className={`nav-tab ${activeTab === 'sales' ? 'active' : ''}`}
          onClick={() => setActiveTab('sales')}
        >
          Team Sales
        </button>
        <button
          className={`nav-tab ${activeTab === 'team' ? 'active' : ''}`}
          onClick={() => setActiveTab('team')}
        >
          Team Members
        </button>
      </div>

      {activeTab === 'sales' && renderSalesTab()}
      {activeTab === 'team' && renderTeamTab()}

      <TLModal
        isOpen={showModal}
        onClose={closeModal}
        type={modalType}
        sale={selectedSale}
        salespersons={salespersons}
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

const TLModal = ({ isOpen, onClose, type, sale, salespersons, onSuccess }) => {
  const [formData, setFormData] = useState({
    policy_number: '',
    vehicle_number: '',
    salesperson_id: '',
    date: new Date().toISOString().split('T')[0],
    name: '',
    phone: ''
  });

  useEffect(() => {
    if (type === 'edit-sale' && sale) {
      setFormData({
        policy_number: sale.policy_number,
        vehicle_number: sale.vehicle_number,
        salesperson_id: sale.salesperson_id?._id || '',
        date: sale.date?.split('T')[0] || '',
        name: '',
        phone: ''
      });
    } else {
      setFormData({
        policy_number: '',
        vehicle_number: '',
        salesperson_id: '',
        date: new Date().toISOString().split('T')[0],
        name: '',
        phone: ''
      });
    }
  }, [type, sale]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (type === 'add-sale') {
        await API.post('/api/sales/add', {
          policy_number: formData.policy_number,
          vehicle_number: formData.vehicle_number,
          salesperson_id: formData.salesperson_id,
          date: formData.date
        });
      } else if (type === 'edit-sale') {
        await API.put(`/api/sales/edit/${sale._id}`, {
          policy_number: formData.policy_number,
          vehicle_number: formData.vehicle_number,
          salesperson_id: formData.salesperson_id,
          date: formData.date
        });
      } else if (type === 'add-salesperson') {
        await API.post('/api/salespersons/add', {
          name: formData.name,
          phone: formData.phone
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

  let title = '';
  if (type === 'add-sale') title = 'Add New Sale';
  else if (type === 'edit-sale') title = 'Edit Sale';
  else if (type === 'add-salesperson') title = 'Add Team Member';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit}>
        {(type === 'add-sale' || type === 'edit-sale') && (
          <>
            <div className="form-group">
              <label className="form-label">Policy Number</label>
              <input
                type="text"
                name="policy_number"
                value={formData.policy_number}
                onChange={handleInputChange}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Vehicle Number</label>
              <input
                type="text"
                name="vehicle_number"
                value={formData.vehicle_number}
                onChange={handleInputChange}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Salesperson</label>
              <select
                name="salesperson_id"
                value={formData.salesperson_id}
                onChange={handleInputChange}
                className="form-select"
                required
              >
                <option value="">Select Salesperson</option>
                {salespersons.map(person => (
                  <option key={person._id} value={person._id}>{person.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className="form-input"
                required
              />
            </div>
          </>
        )}

        {type === 'add-salesperson' && (
          <>
            <div className="form-group">
              <label className="form-label">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
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
                onChange={handleInputChange}
                className="form-input"
                required
              />
            </div>
          </>
        )}

        <div className="modal-actions">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn">
            {type === 'edit-sale' ? 'Update' : 'Add'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default TLDashboard;