import Client from './Client.js';
import Bike from './Bike.js';
import WorkOrder from './WorkOrder.js';
import OrderItem from './OrderItem.js';

// ---- Relaciones ----

Client.hasMany(Bike, { foreignKey: 'client_id', as: 'bikes' });
Bike.belongsTo(Client, { foreignKey: 'client_id', as: 'client' });


Bike.hasMany(WorkOrder, { foreignKey: 'moto_id', as: 'workOrders' });
WorkOrder.belongsTo(Bike, { foreignKey: 'moto_id', as: 'bike' });


WorkOrder.hasMany(OrderItem, { foreignKey: 'work_order_id', as: 'items' });
OrderItem.belongsTo(WorkOrder, { foreignKey: 'work_order_id', as: 'workOrder' });

export { Client, Bike, WorkOrder, OrderItem };
