import { useEffect, useState } from 'react';
import { z } from 'zod';
import { Modal } from '@/common/components/organisms/Modal/Modal';
import { toast } from 'sonner';
import { Input } from '@/common/components/atoms/Input/Input';
import { Dropdown } from '@/common/components/molecules/Dropdown/Dropdown';
import { Button } from '@/common/components/atoms/Button/Button';
import { apiClient } from '@/common/api-client/api-client'; // Importing the apiClient
import { Method } from '@/common/enums';
import { handleZodError } from '@/common/utils/handle-zod-error/handle-zod-error'; // Handle zod error
import { ICustomerCreateTicket } from './interfaces';

// Helper function to generate random IDs
const generateRandomId = (prefix: string) => `${prefix}-${Math.floor(10000000 + Math.random() * 90000000)}`;

export const CreateTicket = ({ isOpen, onClose, workflowId }) => {
    const [customers, setCustomers] = useState<ICustomerCreateTicket[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<ICustomerCreateTicket | null>(null);
    const [ticketTitle, setTicketTitle] = useState('');
    const [ticketDescription, setTicketDescription] = useState('');
    const [loading, setLoading] = useState(false);
  
    const CustomerSchema = z.object({
      id: z.string(),
      firstName: z.string(),
      lastName: z.string(),
      email: z.string(),
      phoneNumber: z.string(),
    });
    const CustomersArraySchema = z.array(CustomerSchema);
  
    const CreateTicketSchema = z.object({
      workflowDefinitionId: z.string(),
      workflowRuntimeId: z.string(),
      ballerineEntityId: z.string(),
      workflowToken: z.string().optional(),
    });
  
    useEffect(() => {
      const fetchCustomers = async () => {
        try {
          setLoading(true);
          const [data, error] = await apiClient({
            endpoint: 'end-users/get-external',
            method: Method.POST,
            schema: CustomersArraySchema,
          });
          const customersData = handleZodError(error, data);
  
          if (customersData) {
            setCustomers(customersData);
          }
        } catch (error) {
          console.error('Error fetching customers:', error);
          toast.error(`Error fetching customers.`);
        } finally {
          setLoading(false);
        }
      };
  
      if (isOpen) {
        fetchCustomers();
      }
    }, [isOpen]);
  
    const handleSubmit = async (event) => {
      event.preventDefault();
  
      if (!selectedCustomer) {
        console.error('No customer selected.');
        toast.error(`No customer selected.`);
        return;
      }
  
      const contextId = generateRandomId('context');
      const entityId = generateRandomId(`entity_${selectedCustomer.id}`);
  
      const payload = {
        workflowId,
        context: {
          id: contextId,
          entity: {
            type: 'individual',
            data: {
              firstName: selectedCustomer.firstName,
              lastName: selectedCustomer.lastName,
              email: selectedCustomer.email,
              phoneNumber: selectedCustomer.phoneNumber,
              title: ticketTitle,
              description: ticketDescription,
            },
            id: entityId,
          },
        },
      };
  
      try {
        const [response, error] = await apiClient({
          useCommonEndPoint: true,
          endpoint: 'case-management',
          method: Method.POST,
          body: payload,
          schema: CreateTicketSchema,
        });
  
        if (error) {
          console.error('Error submitting ticket:', error);
          toast.error(`Error submitting ticket.`);
        } else {
          console.log('Ticket submitted successfully:', response);
          toast.success(`Ticket submitted successfully.`);
          onClose();
        }
      } catch (error) {
        console.error('Unexpected error submitting ticket:', error);
        toast.error(`Unexpected error submitting ticket.`);
      }
    };
  
    return (
        <Modal
        title="Create Ticket"
        isOpen={isOpen}
        onIsOpenChange={onClose}
        className="w-[500px] h-[400px] md:w-[500px] md:h-[400px] p-4 overflow-hidden "
      >
        <div className="p-4">
          {loading ? (
            <div className="flex justify-center items-center">
              <span className="text-xl font-medium">Loading...</span>
            </div>
          ) : (
            <div>          
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="customer" className="block text-sm font-medium">
                        Customer
                        </label>
                        <div >
                        <Dropdown
                            options={customers.map((customer) => ({
                            id: customer.id,
                            value: customer,
                            }))}
                            trigger={
                            <div className="flex justify-between items-center border border-gray-300 rounded-md px-4 py-2 text-sm w-full">
                                {selectedCustomer
                                ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}`
                                : 'Choose a customer'}
                            </div>
                            }
                            props={{
                            trigger: {
                                className:
                                'text-left rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mt-1',
                            },
                            content: {
                                className:
                                'text-left border border-gray-300 rounded-md shadow-md bg-white z-[1050] max-h-40 overflow-y-auto',
                            },
                            }}
                        >
                            {({ item, DropdownItem }) => (
                            <DropdownItem
                                key={item.id}
                                onClick={() => setSelectedCustomer(item.value)}
                                className="w-full p-2 hover:bg-gray-100 cursor-pointer"
                            >
                                {`${item.value.firstName} ${item.value.lastName}`}
                            </DropdownItem>
                            )}
                        </Dropdown>
                        </div>
                    </div>
            
                    <div className="mb-4">
                        <label htmlFor="ticketTitle" className="block text-sm font-medium">
                        Title
                        </label>
                        <Input
                        id="ticketTitle"
                        type="text"
                        value={ticketTitle}
                        onChange={(e) => setTicketTitle(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-opacity-50"
                        required
                        />
                    </div>
            
                    <div className="mb-4">
                        <label htmlFor="ticketDescription" className="block text-sm font-medium">
                        Description
                        </label>
                        <Input
                        id="ticketDescription"
                        rows={4}
                        value={ticketDescription}
                        onChange={(e) => setTicketDescription(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-opacity-50"
                        required
                        />
                    </div>
            
                    <div className="flex justify-end space-x-4">
                        <Button size="sm" variant="success" type="submit">
                        Submit
                        </Button>
                    </div>
                </form>
            </div>
          )}
        </div>
      </Modal>      
    );
  };
  